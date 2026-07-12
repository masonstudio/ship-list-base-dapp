"use client";

import { Check, ClipboardCheck, Loader2, Search, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_NOTE_LENGTH,
  MAX_PROJECT_LENGTH,
  shipListAbi,
  shipListContractAddress,
} from "@/lib/ship-list";

const PRESETS = [
  { projectName: "Base App Submit", mobileReady: true, contractReady: true, assetsReady: false, note: "Mobile and contract pass. Final screenshot polish still needs one more check." },
  { projectName: "Creator Drop", mobileReady: true, contractReady: false, assetsReady: true, note: "Assets are ready. Contract deploy and BaseScan link still need confirmation." },
  { projectName: "Demo Launch", mobileReady: true, contractReady: true, assetsReady: true, note: "Ready to ship. Mobile, contract, and Base submission materials are aligned." },
] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid project")) return "Project name needs 1 to 48 characters.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 140 characters.";
  return error.message;
}

function countReady(mobile: boolean, contract: boolean, assets: boolean) {
  return [mobile, contract, assets].filter(Boolean).length;
}

function ChecklistBoard({
  projectName,
  mobileReady,
  contractReady,
  assetsReady,
  note,
  maker,
  createdAt,
}: {
  projectName: string;
  mobileReady: boolean;
  contractReady: boolean;
  assetsReady: boolean;
  note: string;
  maker?: Address;
  createdAt?: bigint;
}) {
  const readyCount = countReady(mobileReady, contractReady, assetsReady);
  const rows = [
    ["Mobile opens cleanly", mobileReady],
    ["Contract action works", contractReady],
    ["Submission assets ready", assetsReady],
  ] as const;

  return (
    <article className="ship-board">
      <div className="clip" aria-hidden="true" />
      <header className="ship-head">
        <p>Ship List</p>
        <h2>{projectName || "Launch checklist"}</h2>
      </header>
      <section className="ready-score">
        <span>Ready</span>
        <strong>{readyCount}/3</strong>
      </section>
      <section className="check-rows">
        {rows.map(([label, done]) => (
          <div key={label} className={done ? "done" : ""}>
            <span>{done ? <Check /> : null}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </section>
      <section className="ship-note">
        <span>Launch note</span>
        <strong>{note || "Save a launch readiness note on Base."}</strong>
      </section>
      <footer className="ship-foot">
        <div><span>Wallet</span><strong>{shortAddress(maker)}</strong></div>
        <div><span>Stamped</span><strong>{formatDate(createdAt)}</strong></div>
      </footer>
    </article>
  );
}

export function ShipListApp() {
  const [listIdInput, setListIdInput] = useState("1");
  const [projectName, setProjectName] = useState<string>(PRESETS[0].projectName);
  const [mobileReady, setMobileReady] = useState<boolean>(PRESETS[0].mobileReady);
  const [contractReady, setContractReady] = useState<boolean>(PRESETS[0].contractReady);
  const [assetsReady, setAssetsReady] = useState<boolean>(PRESETS[0].assetsReady);
  const [note, setNote] = useState<string>(PRESETS[0].note);
  const [message, setMessage] = useState("Save a launch readiness checklist on Base.");
  const [lastAction, setLastAction] = useState<"save" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });
  const selectedConnector = connectors.find((connector) => connector.id === "injected") ?? connectors.find((connector) => connector.id === "baseAccount") ?? connectors[0];
  const parsedListId = BigInt(Math.max(1, Number(listIdInput || "1")));

  const listQuery = useReadContract({
    abi: shipListAbi,
    address: shipListContractAddress,
    functionName: "getList",
    args: [parsedListId],
    query: { enabled: Boolean(shipListContractAddress), refetchInterval: 12000 },
  });
  const totalQuery = useReadContract({
    abi: shipListAbi,
    address: shipListContractAddress,
    functionName: "nextListId",
    query: { enabled: Boolean(shipListContractAddress), refetchInterval: 12000 },
  });

  const tuple = listQuery.data as readonly [Address, string, boolean, boolean, boolean, string, bigint] | undefined;
  const liveList = useMemo(() => tuple ? {
    maker: tuple[0],
    projectName: tuple[1],
    mobileReady: tuple[2],
    contractReady: tuple[3],
    assetsReady: tuple[4],
    note: tuple[5],
    createdAt: tuple[6],
  } : undefined, [tuple]);

  const totalLists = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields = projectName.trim().length > 0 && projectName.trim().length <= MAX_PROJECT_LENGTH && note.trim().length > 0 && note.trim().length <= MAX_NOTE_LENGTH;
  const saveBlocker = !shipListContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_SHIP_LIST_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill project name and note."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "save") return;
    void totalQuery.refetch();
    void listQuery.refetch();
    const logs = parseEventLogs({ abi: shipListAbi, logs: receipt.logs, eventName: "ListSaved" });
    const listId = logs[0]?.args.listId;
    window.setTimeout(() => {
      if (listId) setListIdInput(listId.toString());
      setMessage(listId ? `Ship list #${listId.toString()} saved on Base.` : "Ship list saved on Base.");
    }, 0);
  }, [lastAction, receipt, totalQuery, listQuery]);

  async function connectWallet() {
    const queue = [connectors.find((connector) => connector.id === "injected"), connectors.find((connector) => connector.id === "baseAccount"), selectedConnector]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, list) => list.findIndex((item) => item.id === connector.id) === index);
    if (!queue.length) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }
    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of queue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Save the checklist when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function saveList() {
    const contractAddress = shipListContractAddress;
    if (saveBlocker) {
      setMessage(saveBlocker);
      return;
    }
    if (!contractAddress) return;
    try {
      setLastAction("save");
      setMessage("Confirm the checklist in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: shipListAbi,
        functionName: "saveList",
        args: [projectName.trim(), mobileReady, contractReady, assetsReady, note.trim()],
        chainId: base.id,
      });
      setMessage("Checklist sent. Waiting for Base confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setProjectName(preset.projectName);
    setMobileReady(preset.mobileReady);
    setContractReady(preset.contractReady);
    setAssetsReady(preset.assetsReady);
    setNote(preset.note);
  }

  return (
    <main className="ship-shell">
      <section className="ship-panel">
        <header className="panel-head">
          <div><p>Ship List</p><h1>Check before ship.</h1></div>
          <div className="clip-icon"><ClipboardCheck /></div>
        </header>
        <div className="ship-stats">
          <div><span>Lists</span><strong>{totalLists}</strong></div>
          <div><span>Chain</span><strong>Base</strong></div>
        </div>
        <div className="ship-presets">
          {PRESETS.map((preset, index) => (
            <button key={preset.projectName} onClick={() => applyPreset(index)}>
              <span>{countReady(preset.mobileReady, preset.contractReady, preset.assetsReady)}/3</span>
              <div><strong>{preset.projectName}</strong><small>{preset.note}</small></div>
            </button>
          ))}
        </div>
        <label><span>Project</span><input value={projectName} onChange={(event) => setProjectName(event.target.value)} maxLength={MAX_PROJECT_LENGTH} /></label>
        <div className="toggle-list">
          <button className={mobileReady ? "active" : ""} onClick={() => setMobileReady(!mobileReady)}><Check /> Mobile ready</button>
          <button className={contractReady ? "active" : ""} onClick={() => setContractReady(!contractReady)}><Check /> Contract ready</button>
          <button className={assetsReady ? "active" : ""} onClick={() => setAssetsReady(!assetsReady)}><Check /> Assets ready</button>
        </div>
        <label><span>Note</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={MAX_NOTE_LENGTH} rows={3} /></label>
        <div className="ship-actions">
          {isConnected && chainId !== base.id ? (
            <button className="save-list" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>{switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Switch to Base</button>
          ) : (
            <button className="save-list" disabled={writing || confirming} onClick={saveList}>{writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}Save on Base</button>
          )}
          {isConnected ? (
            <button className="wallet-list" onClick={disconnectWallet}>{shortAddress(address)}</button>
          ) : (
            <button className="wallet-list" disabled={!selectedConnector || connecting} onClick={connectWallet}>{connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Connect wallet</button>
          )}
        </div>
        <p className="ship-status">{message}</p>
        {hash ? <a className="ship-tx" href={`https://basescan.org/tx/${hash}`} rel="noreferrer" target="_blank">View transaction on BaseScan</a> : null}
      </section>
      <section className="ship-display">
        <ChecklistBoard
          projectName={liveList?.projectName || projectName}
          mobileReady={liveList?.mobileReady ?? mobileReady}
          contractReady={liveList?.contractReady ?? contractReady}
          assetsReady={liveList?.assetsReady ?? assetsReady}
          note={liveList?.note || note}
          maker={liveList?.maker}
          createdAt={liveList?.createdAt}
        />
        <div className="ship-lower">
          <section className="lookup-list"><div><Search /><h2>Load list</h2></div><label><span>List ID</span><input value={listIdInput} onChange={(event) => setListIdInput(event.target.value.replace(/\D/g, ""))} /></label></section>
          <section className="about-list"><p>What it does</p><strong>Ship List saves a public launch checklist with readiness count, note, wallet, and timestamp on Base.</strong></section>
        </div>
      </section>
    </main>
  );
}
