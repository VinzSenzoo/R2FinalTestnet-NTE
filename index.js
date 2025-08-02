import "dotenv/config";
import blessed from "blessed";
import figlet from "figlet";
import { ethers } from "ethers";
import axios from "axios";
import FormData from "form-data";
import { v4 as uuid } from "uuid";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const APP_ID = "1356609826230243469";
const GUILD_ID = "1308368864505106442";
const COMMAND_ID = "1356665931056808211";
const COMMAND_VERSION = "1356665931056808212";
const initialProvider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const initialWallet = new ethers.Wallet(process.env.PRIVATE_KEY, initialProvider);
const wallet_address = initialWallet.address;

const NETWORK_CHANNEL_IDS = {
  "Sepolia": "1339883019556749395",
  "Pharos": "1395349206947987456",
  "Monad": "1367156681154236467"
};

const SEPOLIA_CONFIG = {
  RPC_URL: process.env.RPC_URL,
  USDC_ADDRESS: process.env.USDC_ADDRESS,
  R2USD_ADDRESS: process.env.R2USD_ADDRESS,
  sR2USD_ADDRESS: process.env.sR2USD_ADDRESS,
  ROUTER_USDC_TO_R2USD: "0x9e8FF356D35a2Da385C546d6Bf1D77ff85133365",
  ROUTER_R2USD_TO_USDC: "0x47d1B0623bB3E557bF8544C159c9ae51D091F8a2",
  STAKING_CONTRACT: "0x006CbF409CA275bA022111dB32BDAE054a97d488",
  LP_R2USD_sR2USD: "0xe85A06C238439F981c90b2C91393b2F3c46e27FC",
  LP_USDC_R2USD: "0x47d1B0623bB3E557bF8544C159c9ae51D091F8a2",
  NETWORK_NAME: "Sepolia Testnet"
};

const SEPOLIA_R2_CONFIG  = {
  RPC_URL: process.env.RPC_URL,
  R2_ADDRESS: process.env.R2_ADDRESS,
  USDC_ADDRESS: process.env.USDC_ADDRESS,
  R2USD_ADDRESS: process.env.R2_R2USD_ADDRESS,
  ROUTER_USDC_TO_R2USD: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
  ROUTER_R2USD_TO_USDC: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
  ROUTER_ADDRESS: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
  LP_R2_R2USD: "0x9Ae18109692b43e95Ae6BE5350A5Acc5211FE9a1", 
  LP_USDC_R2: "0xCdfDD7dD24bABDD05A2ff4dfcf06384c5Ad661a9", 
  NETWORK_NAME: "Sepolia R2 Testnet"
};


const PHRS_CONFIG = {
  RPC_URL: process.env.PHAROS_RPC_URL,
  USDC_ADDRESS: process.env.PHAROS_USDC_ADDRESS,
  R2USD_ADDRESS: process.env.PHAROS_R2USD_ADDRESS,
  sR2USD_ADDRESS: process.env.PHAROS_sR2USD_ADDRESS,
  ROUTER_USDC_TO_R2USD: "0x4f5b54d4AF2568cefafA73bB062e5d734b55AA05",
  ROUTER_R2USD_TO_USDC: "0x4f5b54d4AF2568cefafA73bB062e5d734b55AA05",
  STAKING_CONTRACT: "0xF8694d25947A0097CB2cea2Fc07b071Bdf72e1f8",
  NETWORK_NAME: "Pharos Network"
};

const MONAD_CONFIG = {
  RPC_URL: process.env.MONAD_RPC_URL,
  USDC_ADDRESS: process.env.MONAD_USDC_ADDRESS,
  R2USD_ADDRESS: process.env.MONAD_R2USD_ADDRESS,
  sR2USD_ADDRESS: process.env.MONAD_sR2USD_ADDRESS,
  ROUTER_USDC_TO_R2USD: "0x4f5b54d4AF2568cefafA73bB062e5d734b55AA05",
  ROUTER_R2USD_TO_USDC: "0x4f5b54d4AF2568cefafA73bB062e5d734b55AA05",
  STAKING_CONTRACT: "0xF8694d25947A0097CB2cea2Fc07b071Bdf72e1f8",
  LP_R2USD_sR2USD_BAL: "0xF472a0de13BdC08907937Acf5E35dA9fCCAa18C4",
  LP_USDC_R2USD_BAL: "0x425cDE58dd27BD6C5Ca2dD345230A0b332Bb8e71",
  LP_R2USD_sR2USD: "0xfB8e1C3b833f9E67a71C859a132cf783b645e436",
  LP_USDC_R2USD: "0xfB8e1C3b833f9E67a71C859a132cf783b645e436",
  NETWORK_NAME: "Monad Network"
};


const DEBUG_MODE = false;

const ERC20ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address recipient, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)"
];

const LP_CONTRACT_ABI = [
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "add_liquidity",
    "inputs": [
      {"name": "_amounts", "type": "uint256[]"},
      {"name": "_min_mint_amount", "type": "uint256"},
      {"name": "_receiver", "type": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "calc_token_amount",
    "inputs": [
      {"name": "_amounts", "type": "uint256[]"},
      {"name": "_is_deposit", "type": "bool"}
    ],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "arg0", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint8"}]
  }
];

const LP_USDC_R2USD_ABI = [
  {
    "stateMutability": "view",
    "type": "function",
    "name": "get_balances",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256[]"}]
  },
  {
    "stateMutability": "view",
    "type": "function",
    "name": "calc_token_amount",
    "inputs": [
      {"name": "_amounts", "type": "uint256[]"},
      {"name": "_is_deposit", "type": "bool"}
    ],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "add_liquidity",
    "inputs": [
      {"name": "_amounts", "type": "uint256[]"},
      {"name": "_min_mint_amount", "type": "uint256"},
      {"name": "_receiver", "type": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256"}]
  }
];

const UNISWAP_V2_LP_ABI = [
  {
    "constant": false,
    "inputs": [
      {"name": "tokenA", "type": "address"},
      {"name": "tokenB", "type": "address"},
      {"name": "amountADesired", "type": "uint256"},
      {"name": "amountBDesired", "type": "uint256"},
      {"name": "amountAMin", "type": "uint256"},
      {"name": "amountBMin", "type": "uint256"},
      {"name": "to", "type": "address"},
      {"name": "deadline", "type": "uint256"}
    ],
    "name": "addLiquidity",
    "outputs": [
      {"name": "amountA", "type": "uint256"},
      {"name": "amountB", "type": "uint256"},
      {"name": "liquidity", "type": "uint256"}
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const randomAmountRanges = {
  "SWAP_R2USD_USDC": {
    USDC: { min: 50, max: 200 },
    R2USD: { min: 50, max: 200 }
  },
  "SWAP_R2_USDC": {
    R2: { min: 50, max: 200 },    
    USDC: { min: 50, max: 200 }  
  },
  "SWAP_R2_R2USD": {
    R2: { min: 50, max: 200 },    
    R2USD: { min: 50, max: 200 } 
  }
};

let currentNetwork = "Sepolia";
let walletInfoByNetwork = {
  "Sepolia": {
    address: "",
    balanceNative: "0.00",
    balanceUsdc: "0.00",
    balanceR2usd: "0.00",
    balanceSr2usd: "0.00",
    balanceLpR2usdSr2usd: "0.00",
    balanceLpUsdcR2usd: "0.00",
    network: SEPOLIA_CONFIG.NETWORK_NAME,
    status: "Initializing"
  },
  "Sepolia R2": {
    address: "",
    balanceNative: "0.00",
    balanceUsdc: "0.00",
    balanceR2usd: "0.00",
    balanceR2: "0.00",
    balanceLpR2R2usd: "0.00",
    balanceLpUsdcR2: "0.00",
    network: SEPOLIA_R2_CONFIG.NETWORK_NAME,
    status: "Initializing"
  }, 
  "Pharos": {
    address: "",
    balanceNative: "0.00",
    balanceUsdc: "0.00",
    balanceR2usd: "0.00",
    balanceSr2usd: "0.00",
    balanceLpR2usdSr2usd: "N/A",
    balanceLpUsdcR2usd: "N/A",
    network: PHRS_CONFIG.NETWORK_NAME,
    status: "Initializing"
  },
  "Monad": {
    address: "",
    balanceNative: "0.00",
    balanceUsdc: "0.00",
    balanceR2usd: "0.00",
    balanceSr2usd: "0.00",
    balanceLpR2usdSr2usd: "N/A",
    balanceLpUsdcR2usd: "N/A",
    network: MONAD_CONFIG.NETWORK_NAME,
    status: "Initializing"
  }
};

let transactionLogs = [];
let MY_USER_ID = null;
let claimRunning = false;
let claimCancelled = false;
let dailyClaimInterval = null;
let swapRunningSepolia = false;
let swapCancelledSepolia = false;
let swapRunningSepoliaR2 = false;
let swapCancelledSepoliaR2 = false;
let swapRunningPharos = false;
let swapCancelledPharos = false;
let swapRunningMonad = false;
let swapCancelledMonad = false;
let globalWallet = null;
let provider = null;
let transactionQueue = Promise.resolve();
let transactionQueueList = [];
let transactionIdCounter = 0;
let nextNonceSepolia = null;
let nextNonceSepoliaR2 = null;
let nextNoncePharos = null;
let nextNonceMonad = null;
let swapDirection = {
  "Sepolia": true,
  "Sepolia R2": true,
  "Pharos": true,
  "Monad": true
};

function getShortAddress(address) {
  return address ? address.slice(0, 6) + "..." + address.slice(-4) : "N/A";
}

function getShortHash(hash) {
  return hash ? hash.slice(0, 6) + "..." + hash.slice(-4) : "N/A";
}

function addLog(message, type, network = currentNetwork) {
  if (type === "debug" && !DEBUG_MODE) return;
  const timestamp = new Date().toLocaleTimeString();
  let coloredMessage = message;
  if (type === "swap") coloredMessage = `{bright-cyan-fg}${message}{/bright-cyan-fg}`;
  else if (type === "system") coloredMessage = `{bright-white-fg}${message}{/bright-white-fg}`;
  else if (type === "error") coloredMessage = `{bright-red-fg}${message}{/bright-red-fg}`;
  else if (type === "success") coloredMessage = `{bright-green-fg}${message}{/bright-green-fg}`;
  else if (type === "warning") coloredMessage = `{bright-yellow-fg}${message}{/bright-yellow-fg}`;
  else if (type === "debug") coloredMessage = `{bright-magenta-fg}${message}{/bright-magenta-fg}`;

  transactionLogs.push(`{bright-cyan-fg}[{/bright-cyan-fg} {bold}{magenta-fg}${timestamp}{/magenta-fg}{/bold} {bright-cyan-fg}]{/bright-cyan-fg} {bold}{bright-cyan-fg}[{/bright-cyan-fg}{magenta-fg}${network}{/magenta-fg}{bright-cyan-fg}]{/bright-cyan-fg}{/bold}{bold} ${coloredMessage}{/bold}`);
  updateLogs();
}

function getRandomDelay() {
  return Math.random() * (60000 - 30000) + 30000;
}

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function updateLogs() {
  logsBox.setContent(transactionLogs.join("\n"));
  logsBox.setScrollPerc(100);
  safeRender();
}

function clearTransactionLogs() {
  transactionLogs = [];
  logsBox.setContent("");
  logsBox.setScroll(0);
  updateLogs();
  safeRender();
  addLog("Transaction logs telah dihapus.", "system", currentNetwork);
}

async function fetchMyUserId() {
  if (MY_USER_ID) return MY_USER_ID;
  const res = await axios.get("https://discord.com/api/v9/users/@me", {
    headers: { Authorization: DISCORD_TOKEN }
  });
  MY_USER_ID = res.data.id;
  return MY_USER_ID;
}

async function delayWithCancel(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (claimCancelled) {
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return true;
}

async function waitWithCancel(delay, type, network) {
  return Promise.race([
    new Promise(resolve => setTimeout(resolve, delay)),
    new Promise(resolve => {
      const interval = setInterval(() => {
        if (type === "swap" && (
          (network === "Sepolia" && swapCancelledSepolia) ||
          (network === "Sepolia R2" && swapCancelledSepoliaR2) ||
          (network === "Pharos" && swapCancelledPharos) ||
          (network === "Monad" && swapCancelledMonad)
        )) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    })
  ]);
}

async function addTransactionToQueue(transactionFunction, description = "Transaksi", network) {
  const transactionId = ++transactionIdCounter;
  transactionQueueList.push({
    id: transactionId,
    description,
    timestamp: new Date().toLocaleTimeString(),
    status: "queued"
  });
  addLog(`Transaksi [${transactionId}] ditambahkan ke antrean: ${description}`, "system", network || currentNetwork);
  updateQueueDisplay();

  transactionQueue = transactionQueue.then(async () => {
    updateTransactionStatus(transactionId, "processing");
    let normalizedNetwork; 
    let localProvider; 
    try {
      let config;
      normalizedNetwork = network; 
      if (!network) {
        normalizedNetwork = currentNetwork;
      }
      if (normalizedNetwork === "Sepolia" || normalizedNetwork === "Sepolia Testnet") {
        config = SEPOLIA_CONFIG;
        normalizedNetwork = "Sepolia";
      } else if (normalizedNetwork === "Sepolia R2" || normalizedNetwork === "Sepolia R2 Testnet") {
        config = SEPOLIA_R2_CONFIG;
        normalizedNetwork = "Sepolia R2";
      } else if (normalizedNetwork === "Pharos" || normalizedNetwork === "Pharos Network") {
        config = PHRS_CONFIG;
        normalizedNetwork = "Pharos";
      } else if (normalizedNetwork === "Monad" || normalizedNetwork === "Monad Network") {
        config = MONAD_CONFIG;
        normalizedNetwork = "Monad";
      } else {
        throw new Error(`Jaringan tidak dikenal: ${normalizedNetwork || 'tidak diberikan'}`);
      }

      addLog(`NormalizedNetwork disetel ke: ${normalizedNetwork}`, "debug", normalizedNetwork);

      localProvider = new ethers.JsonRpcProvider(config.RPC_URL);
      const localWallet = new ethers.Wallet(process.env.PRIVATE_KEY, localProvider);

      let nextNonce;
      if (normalizedNetwork === "Sepolia") {
        if (nextNonceSepolia === null) {
          nextNonceSepolia = await localProvider.getTransactionCount(localWallet.address, "pending");
        }
        nextNonce = nextNonceSepolia;
      } else if (normalizedNetwork === "Sepolia R2") {
        if (nextNonceSepoliaR2 === null) {
          nextNonceSepoliaR2 = await localProvider.getTransactionCount(localWallet.address, "pending");
        }
        nextNonce = nextNonceSepoliaR2;
      } else if (normalizedNetwork === "Pharos") {
        if (nextNoncePharos === null) {
          nextNoncePharos = await localProvider.getTransactionCount(localWallet.address, "pending");
        }
        nextNonce = nextNoncePharos;
      } else if (normalizedNetwork === "Monad") {
        if (nextNonceMonad === null) {
          nextNonceMonad = await localProvider.getTransactionCount(localWallet.address, "pending");
        }
        nextNonce = nextNonceMonad;
      }

      const tx = await transactionFunction(nextNonce, localWallet, localProvider, config);
      const txHash = tx.hash;
      addLog(`Transaksi Dikirim. Hash: ${getShortHash(txHash)}`, "warning", normalizedNetwork);
      const receipt = await tx.wait();
      if (normalizedNetwork === "Sepolia") nextNonceSepolia++;
      else if (normalizedNetwork === "Sepolia R2") nextNonceSepoliaR2++;
      else if (normalizedNetwork === "Pharos") nextNoncePharos++;
      else if (normalizedNetwork === "Monad") nextNonceMonad++;

      if (receipt.status === 1) {
        updateTransactionStatus(transactionId, "completed");
        addLog(`Transaksi Selesai. Hash: ${getShortHash(receipt.transactionHash || txHash)}`, "success", normalizedNetwork);
      } else {
        updateTransactionStatus(transactionId, "failed");
        addLog(`Transaksi [${transactionId}] gagal: Transaksi ditolak oleh kontrak.`, "error", normalizedNetwork);
      }
      return { receipt, txHash, tx };
    } catch (error) {
      updateTransactionStatus(transactionId, "error");
      let errorMessage = error.message;
      if (error.code === "CALL_EXCEPTION") {
        errorMessage = `Transaksi ditolak oleh kontrak: ${error.reason || "Alasan tidak diketahui"}`;
      }
      addLog(`Transaksi [${transactionId}] gagal: ${errorMessage}`, "error", network || currentNetwork);
      if (error.message.includes("nonce has already been used")) {
        if (normalizedNetwork === "Sepolia") nextNonceSepolia++;
        else if (normalizedNetwork === "Sepolia R2") nextNonceSepoliaR2++;
        else if (normalizedNetwork === "Pharos") nextNoncePharos++;
        else if (normalizedNetwork === "Monad") nextNonceMonad++;
      } else if (error.message.includes("nonce too high")) {
        const currentNonce = await localProvider.getTransactionCount(localWallet.address, "pending");
        if (normalizedNetwork === "Sepolia") nextNonceSepolia = currentNonce;
        else if (normalizedNetwork === "Sepolia R2") nextNonceSepoliaR2 = currentNonce;
        else if (normalizedNetwork === "Pharos") nextNoncePharos = currentNonce;
        else if (normalizedNetwork === "Monad") nextNonceMonad = currentNonce;
      }
      return null;
    } finally {
      removeTransactionFromQueue(transactionId);
      updateQueueDisplay();
    }
  });
  return transactionQueue;
}

async function claimAllFaucetsWithDelay(network, { isDailyClaim = false } = {}) {
  claimRunning = true;
  claimCancelled = false;
  claimFaucetSubMenu.setItems(getClaimFaucetSubMenuItems());
  safeRender();

  const networks = Object.keys(NETWORK_CHANNEL_IDS);
  for (const network of networks) {
    if (claimCancelled) {
      addLog("Proses claim faucet dihentikan.", "warning", network);
      break;
    }
    await claimFaucet(network);
    if (!claimCancelled && network !== networks[networks.length - 1]) {
      const delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
      addLog(`Menunggu ${delay / 1000} Detik sebelum klaim berikutnya...`, "swap", network);
      const delayCompleted = await delayWithCancel(delay);
      if (!delayCompleted) {
        addLog("Proses claim faucet dihentikan selama jeda.", "warning", network);
        break;
      }
    }
  }

  claimRunning = false;
  if (isDailyClaim) {
    addLog("Auto Daily Claim Faucet selesai, menunggu 24 jam untuk Looping.", "swap", network);
  } else {
    addLog("Auto Claim Faucet selesai.", "success", network);
  }  claimFaucetSubMenu.setItems(getClaimFaucetSubMenuItems());
  safeRender();
}

function startAutoDailyClaim() {
  if (dailyClaimInterval) {
    addLog("Auto Daily Claim Faucet All Network sudah berjalan.", "warning");
    return;
  }
  dailyClaimInterval = setInterval(() => {
    if (!claimRunning) {
      claimAllFaucetsWithDelay();
    }
  },86400000);
  claimAllFaucetsWithDelay();
  addLog("Auto Daily Claim Faucet All Network dimulai.", "system");
  claimFaucetSubMenu.setItems(getClaimFaucetSubMenuItems());
  safeRender();
}

function stopAutoDailyClaim(network) {
  if (dailyClaimInterval) {
    clearInterval(dailyClaimInterval);
    dailyClaimInterval = null;
    addLog("Auto Daily Claim Faucet All Network dihentikan.", "system", network);
  }
  if (claimRunning) {
    claimCancelled = true;
    addLog("Proses claim faucet dihentikan.", "system", network);
  }
  claimFaucetSubMenu.setItems(getClaimFaucetSubMenuItems());
  safeRender();
}

async function claimFaucet(network) {
  try {
    if (!DISCORD_TOKEN) {
      throw new Error("DISCORD_TOKEN tidak ditemukan di .env. Silakan tambahkan token Discord Anda.");
    }
    if (!wallet_address) {
      throw new Error("Wallet address tidak tersedia. Cek Private Key Anda");
    }
    const channelId = NETWORK_CHANNEL_IDS[network];
    if (!channelId) {
      throw new Error(`Jaringan ${network} tidak didukung untuk claim faucet.`);
    }

    const userId = await fetchMyUserId();
    const address = wallet_address;

    const payload = {
      type: 2,
      application_id: APP_ID,
      guild_id: GUILD_ID,
      channel_id: channelId,
      session_id: uuid(),
      data: {
        version: COMMAND_VERSION,
        id: COMMAND_ID,
        name: "faucet",
        type: 1,
        options: [{ type: 3, name: "address", value: address }]
      },
      nonce: Date.now().toString()
    };
    const form = new FormData();
    form.append("payload_json", JSON.stringify(payload));

    await axios.post("https://discord.com/api/v9/interactions", form, {
      headers: { Authorization: DISCORD_TOKEN, ...form.getHeaders() }
    });
    addLog(`Command Claiming Faucet Sent...`, "swap", network);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const res = await axios.get(
      `https://discord.com/api/v9/channels/${channelId}/messages?limit=10`,
      { headers: { Authorization: DISCORD_TOKEN } }
    );
    const messages = res.data;
    const myResponse = messages.find(m =>
      m.author.id === APP_ID && m.interaction?.user?.id === userId
    );

    if (!myResponse) {
      addLog(`No Response Claiming ${network}.`, "warning", network);
      return;
    }

    const txt = myResponse.content || "";
    if (txt.includes("successfully")) {
      addLog(`Claiming Faucet ${network} Successfully`, "success", network);
    } else if (txt.toLowerCase().includes("claim failed")) {
      addLog(`${txt.split("\n")[0]}`, "warning", network);
    } else {
      addLog(`Unknown Status Clain at ${network}: ${txt}`, "system", network);
    }
  } catch (error) {
    addLog(`Error: ${error.message}`, "error", network);
  }
}

function updateTransactionStatus(id, status) {
  transactionQueueList.forEach(tx => {
    if (tx.id === id) tx.status = status;
  });
  updateQueueDisplay();
}

function removeTransactionFromQueue(id) {
  transactionQueueList = transactionQueueList.filter(tx => tx.id !== id);
  updateQueueDisplay();
}

function getTransactionQueueContent() {
  if (transactionQueueList.length === 0) return "Tidak ada transaksi dalam antrean.";
  return transactionQueueList
    .map(tx => `ID: ${tx.id} | ${tx.description} | ${tx.status} | ${tx.timestamp}`)
    .join("\n");
}

let queueMenuBox = null;
let queueUpdateInterval = null;

function showTransactionQueueMenu() {
  const container = blessed.box({
    label: " Antrian Transaksi ",
    top: "10%",
    left: "center",
    width: "80%",
    height: "80%",
    border: { type: "line" },
    style: { border: { fg: "blue" } },
    keys: true,
    mouse: true,
    interactive: true
  });
  const contentBox = blessed.box({
    top: 0,
    left: 0,
    width: "100%",
    height: "90%",
    content: getTransactionQueueContent(),
    scrollable: true,
    keys: true,
    mouse: true,
    alwaysScroll: true,
    scrollbar: { ch: " ", inverse: true, style: { bg: "blue" } }
  });
  const exitButton = blessed.button({
    content: " [Keluar] ",
    bottom: 0,
    left: "center",
    shrink: true,
    padding: { left: 1, right: 1 },
    style: { fg: "white", bg: "red", hover: { bg: "blue" } },
    mouse: true,
    keys: true,
    interactive: true
  });
  exitButton.on("press", () => {
    addLog("Keluar Dari Menu Antrian Transaksi.", "system", currentNetwork);
    clearInterval(queueUpdateInterval);
    container.destroy();
    queueMenuBox = null;
    mainMenu.show();
    mainMenu.focus();
    screen.render();
  });
  container.key(["a", "s", "d"], () => {
    addLog("Keluar Dari Menu Antrian Transaksi.", "system", currentNetwork);
    clearInterval(queueUpdateInterval);
    container.destroy();
    queueMenuBox = null;
    mainMenu.show();
    mainMenu.focus();
    screen.render();
  });
  container.append(contentBox);
  container.append(exitButton);
  queueUpdateInterval = setInterval(() => {
    contentBox.setContent(getTransactionQueueContent());
    screen.render();
  }, 1000);
  mainMenu.hide();
  screen.append(container);
  container.focus();
  screen.render();
}

function updateQueueDisplay() {
  if (queueMenuBox) {
    queueMenuBox.setContent(getTransactionQueueContent());
    screen.render();
  }
}

const screen = blessed.screen({
  smartCSR: true,
  title: "R2 Auto Bot",
  fullUnicode: true,
  mouse: true
});

let renderTimeout;

function safeRender() {
  if (renderTimeout) clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => { screen.render(); }, 50);
}

const headerBox = blessed.box({
  top: 0,
  left: "center",
  width: "100%",
  tags: true,
  style: { fg: "white", bg: "default" }
});

figlet.text("NT EXHAUST".toUpperCase(), { font: "ANSI Shadow" }, (err, data) => {
  if (err) headerBox.setContent("{center}{bold}NT EXHAUST{/bold}{/center}");
  else headerBox.setContent(`{center}{bold}{bright-cyan-fg}${data}{/bright-cyan-fg}{/bold}{/center}`);
  safeRender();
});

const descriptionBox = blessed.box({
  left: "center",
  width: "100%",
  content: "{center}{bold}{grey-fg}________________________________________________________________________{/grey-fg}{/bold}{/center}",
  tags: true,
  style: { fg: "white", bg: "default" }
});

const logsBox = blessed.box({
  label: " Transaction Logs ",
  left: 0,
  border: { type: "line" },
  scrollable: true,
  alwaysScroll: true,
  mouse: true,
  keys: true,
  vi: true,
  tags: true,
  style: { border: { fg: "yellow" }, fg: "white" },
  scrollbar: { ch: " ", inverse: true, style: { bg: "blue" } },
  content: ""
});

const welcomeBox = blessed.box({
  label: " Dashboard ",
  border: { type: "line" },
  tags: true,
  style: { border: { fg: "cyan" }, fg: "white", bg: "default" },
  content: "{center}{bold}Initializing...{/bold}{/center}"
});

const walletBox = blessed.box({
  label: " Informasi Wallet ",
  border: { type: "line" },
  tags: true,
  style: { border: { fg: "magenta" }, fg: "white", bg: "default" },
  content: "Loading data wallet..."
});

walletBox.hide();

const mainMenu = blessed.list({
  label: " Menu ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "green", fg: "black" } },
  items: getMainMenItems()
});

function getMainMenItems() {
  let items = [];
  if (swapRunningSepolia || swapRunningSepoliaR2 || swapRunningPharos || swapRunningMonad) items.push("Stop All Transaction");
  items = items.concat([
    "Sepolia Network",
    "Sepolia R2 Network",
    "Pharos Network",
    "Monad Network",
    "Claim Faucet",
    "Antrian Transaksi",
    "Clear Transaction Logs",
    "Refresh",
    "Exit"
  ]);
  return items;
}

function getSepoliaSubMenuItems() {
  let items = [];
  if (swapRunningSepolia) items.push("Stop Transaction");
  items = items.concat([
    "Auto Swap R2USD & USDC",
    "Auto Stake R2USD & sR2USD",
    "Auto Add LP R2USD & sR2USD",
    "Auto Add LP USDC & R2USD",
    "Manual Swap",
    "Change Random Amount",
    "Clear Transaction Logs",
    "Back To Main Menu",
    "Refresh"
  ]);
  return items;
}

function getSepoliaR2SubMenuItems() {
  let items = [];
  if (swapRunningSepoliaR2) items.push("Stop Transaction");
  items = items.concat([
    "Auto Swap R2 & USDC",
    "Auto Swap R2 & R2USD",
    "Auto Add LP R2 & USDC", 
    "Auto Add LP R2 & R2USD",
    "Manual Swap",
    "Change Random Amount",
    "Clear Transaction Logs",
    "Back To Main Menu",
    "Refresh"
  ]);
  return items;
}

function getPharosSubMenuItems() {
  let items = [];
  if (swapRunningPharos) items.push("Stop Transaction");
  items = items.concat([
    "Auto Swap R2USD & USDC",
    "Auto Stake R2USD & sR2USD",
    "Manual Swap",
    "Change Random Amount",
    "Clear Transaction Logs",
    "Back To Main Menu",
    "Refresh"
  ]);
  return items;
}

function getMonadSubMenuItems() {
  let items = [];
  if (swapRunningMonad) items.push("Stop Transaction");
  items = items.concat([
    "Auto Swap R2USD & USDC",
    "Auto Stake R2USD & sR2USD",
    "Auto Add LP R2USD & sR2USD",  
    "Auto Add LP USDC & R2USD",    
    "Manual Swap",
    "Change Random Amount",
    "Clear Transaction Logs",
    "Back To Main Menu",
    "Refresh"
  ]);
  return items;
}


function getClaimFaucetSubMenuItems() {
  const items = [
    "Auto Claim Faucet All Network",
    "Auto Daily Claim Faucet All Network",
    "Claim Faucet Sepolia",
    "Claim Faucet Sepolia R2",
    "Claim Faucet Pharos",
    "Claim Faucet Monad",
    "Clear Transaction Logs",
    "Refresh",
    "Back to Main Menu",
  ];

  if (dailyClaimInterval) {
    items.splice(1, 0, "Stop Auto Daily Claim");
  } else if (claimRunning) {
    items.splice(1, 0, "Stop Proses");
  }

  return items;
}


const sepoliaSubMenu = blessed.list({
  label: " Sepolia Network Sub Menu ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: getSepoliaSubMenuItems()
});
sepoliaSubMenu.hide();

const r2SepoliaSubMenu = blessed.list({
  label: " Sepolia R2 Network Sub Menu ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: getSepoliaR2SubMenuItems()
});
r2SepoliaSubMenu.hide();

const pharosSubMenu = blessed.list({
  label: " Pharos Network Sub Menu ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: getPharosSubMenuItems()
});
pharosSubMenu.hide();

const monadSubMenu = blessed.list({
  label: " Monad Network Sub Menu ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: getMonadSubMenuItems()
});
monadSubMenu.hide();

const claimFaucetSubMenu = blessed.list({
  label: " Claim Faucet ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: getClaimFaucetSubMenuItems()
});
claimFaucetSubMenu.hide();

const sepoliaManualSwapSubMenu = blessed.list({
  label: " Manual Swap ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: ["USDC -> R2USD", "R2USD -> USDC", "Back To Sepolia Network Menu"]
});
sepoliaManualSwapSubMenu.hide();

const r2SepoliaManualSwapSubMenu = blessed.list({
  label: " Manual Swap ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: [
    "R2 -> USDC",
    "USDC -> R2",
    "R2 -> R2USD",
    "R2USD -> R2",
    "Back To Sepolia R2 Network Menu"
  ]
});
r2SepoliaManualSwapSubMenu.hide();

const pharosManualSwapSubMenu = blessed.list({
  label: " Manual Swap ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: ["USDC -> R2USD", "R2USD -> USDC", "Back To Pharos Network Menu"]
});
pharosManualSwapSubMenu.hide();

const monadManualSwapSubMenu = blessed.list({
  label: " Manual Swap ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: ["USDC -> R2USD", "R2USD -> USDC", "Back To Monad Network Menu"]
});
monadManualSwapSubMenu.hide();

const sepoliaChangeRandomAmountSubMenu = blessed.list({
  label: " Change Random Amount ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: ["SWAP_R2USD_USDC", "Back To Sepolia Network Menu"]
});
sepoliaChangeRandomAmountSubMenu.hide();

const r2SepoliaChangeRandomAmountSubMenu = blessed.list({
  label: " Change Random Amount ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: ["SWAP_R2USD_USDC", "Back To Sepolia R2 Network Menu"]
});
r2SepoliaChangeRandomAmountSubMenu.hide();

const pharosChangeRandomAmountSubMenu = blessed.list({
  label: " Change Random Amount ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: ["SWAP_R2USD_USDC", "Back To Pharos Network Menu"]
});
pharosChangeRandomAmountSubMenu.hide();

const monadChangeRandomAmountSubMenu = blessed.list({
  label: " Change Random Amount ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "red" }, selected: { bg: "cyan", fg: "black" } },
  items: ["SWAP_R2USD_USDC", "Back To Monad Network Menu"]
});
monadChangeRandomAmountSubMenu.hide();

const promptBox = blessed.prompt({
  parent: screen,
  border: "line",
  height: 5,
  width: "60%",
  top: "center",
  left: "center",
  label: "{bright-blue-fg}Prompt{/bright-blue-fg}",
  tags: true,
  keys: true,
  vi: true,
  mouse: true,
  style: { fg: "bright-red", bg: "default", border: { fg: "red" } }
});

screen.append(headerBox);
screen.append(descriptionBox);
screen.append(logsBox);
screen.append(welcomeBox);
screen.append(walletBox);
screen.append(mainMenu);
screen.append(sepoliaSubMenu);
screen.append(r2SepoliaSubMenu);
screen.append(pharosSubMenu);
screen.append(monadSubMenu);
screen.append(claimFaucetSubMenu);
screen.append(sepoliaManualSwapSubMenu);
screen.append(r2SepoliaManualSwapSubMenu);
screen.append(pharosManualSwapSubMenu);
screen.append(monadManualSwapSubMenu);
screen.append(sepoliaChangeRandomAmountSubMenu);
screen.append(r2SepoliaChangeRandomAmountSubMenu);
screen.append(pharosChangeRandomAmountSubMenu);
screen.append(monadChangeRandomAmountSubMenu);

function updateWelcomeBox() {
  const currentTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  const botVersion = "V2.1.0";

  const content =
    `{center}{bold}{bright-red-fg}[:: R2 :: AUTO :: BOT ::]{/bright-red-fg}{/bold}{/center}\n\n` +
    `{center}{bold}{bright-yellow-fg}Version : ${botVersion}{/bright-yellow-fg}{/bold}{/center}\n` +
    `{center}{bold}{bright-cyan-fg}➥ Join Telegram : t.me/NTExhaust{/bright-cyan-fg}{/bold}{/center}\n` +
    `{center}{bold}{bright-cyan-fg}➥ Subscribe : Youtube.com/@NTExhaust{/bright-cyan-fg}{/bold}{/center}\n` +
    `{center}{bold}{grey-fg}Donate : saweria.co/vinsenzo{/grey-fg}{/bold}{/center}\n`;

  welcomeBox.setContent(content);
  safeRender();
}

function adjustLayout() {
  const screenHeight = screen.height;
  const screenWidth = screen.width;
  const headerHeight = Math.max(8, Math.floor(screenHeight * 0.15));
  headerBox.top = 0;
  headerBox.height = headerHeight;
  headerBox.width = "100%";
  descriptionBox.top = "23%";
  descriptionBox.height = Math.floor(screenHeight * 0.05);
  logsBox.top = headerHeight + descriptionBox.height;
  logsBox.left = 0;
  logsBox.width = Math.floor(screenWidth * 0.6);
  logsBox.height = screenHeight - (headerHeight + descriptionBox.height);
  welcomeBox.top = headerHeight + descriptionBox.height;
  welcomeBox.left = Math.floor(screenWidth * 0.6);
  welcomeBox.width = Math.floor(screenWidth * 0.4);
  welcomeBox.height = Math.floor(screenHeight * 0.35);
  walletBox.top = headerHeight + descriptionBox.height;
  walletBox.left = Math.floor(screenWidth * 0.6);
  walletBox.width = Math.floor(screenWidth * 0.4);
  walletBox.height = Math.floor(screenHeight * 0.35);
  mainMenu.top = headerHeight + descriptionBox.height + welcomeBox.height;
  mainMenu.left = Math.floor(screenWidth * 0.6);
  mainMenu.width = Math.floor(screenWidth * 0.4);
  mainMenu.height = screenHeight - (headerHeight + descriptionBox.height + welcomeBox.height);
  sepoliaSubMenu.top = mainMenu.top;
  sepoliaSubMenu.left = mainMenu.left;
  sepoliaSubMenu.width = mainMenu.width;
  sepoliaSubMenu.height = mainMenu.height;
  r2SepoliaSubMenu.top = mainMenu.top;
  r2SepoliaSubMenu.left = mainMenu.left;
  r2SepoliaSubMenu.width = mainMenu.width;
  r2SepoliaSubMenu.height = mainMenu.height;
  pharosSubMenu.top = mainMenu.top;
  pharosSubMenu.left = mainMenu.left;
  pharosSubMenu.width = mainMenu.width;
  pharosSubMenu.height = mainMenu.height;
  monadSubMenu.top = mainMenu.top;
  monadSubMenu.left = mainMenu.left;
  monadSubMenu.width = mainMenu.width;
  monadSubMenu.height = mainMenu.height;
  claimFaucetSubMenu.top = mainMenu.top;
  claimFaucetSubMenu.left = mainMenu.left;
  claimFaucetSubMenu.width = mainMenu.width;
  claimFaucetSubMenu.height = mainMenu.height;
  sepoliaManualSwapSubMenu.top = mainMenu.top;
  sepoliaManualSwapSubMenu.left = mainMenu.left;
  sepoliaManualSwapSubMenu.width = mainMenu.width;
  sepoliaManualSwapSubMenu.height = mainMenu.height;
  r2SepoliaManualSwapSubMenu.top = mainMenu.top;
  r2SepoliaManualSwapSubMenu.left = mainMenu.left;
  r2SepoliaManualSwapSubMenu.width = mainMenu.width;
  r2SepoliaManualSwapSubMenu.height = mainMenu.height;
  pharosManualSwapSubMenu.top = mainMenu.top;
  pharosManualSwapSubMenu.left = mainMenu.left;
  pharosManualSwapSubMenu.width = mainMenu.width;
  pharosManualSwapSubMenu.height = mainMenu.height;
  monadManualSwapSubMenu.top = mainMenu.top;
  monadManualSwapSubMenu.left = mainMenu.left;
  monadManualSwapSubMenu.width = mainMenu.width;
  monadManualSwapSubMenu.height = mainMenu.height;
  sepoliaChangeRandomAmountSubMenu.top = mainMenu.top;
  sepoliaChangeRandomAmountSubMenu.left = mainMenu.left;
  sepoliaChangeRandomAmountSubMenu.width = mainMenu.width;
  sepoliaChangeRandomAmountSubMenu.height = mainMenu.height;
  r2SepoliaChangeRandomAmountSubMenu.top = mainMenu.top;
  r2SepoliaChangeRandomAmountSubMenu.left = mainMenu.left;
  r2SepoliaChangeRandomAmountSubMenu.width = mainMenu.width;
  r2SepoliaChangeRandomAmountSubMenu.height = mainMenu.height;
  pharosChangeRandomAmountSubMenu.top = mainMenu.top;
  pharosChangeRandomAmountSubMenu.left = mainMenu.left;
  pharosChangeRandomAmountSubMenu.width = mainMenu.width;
  pharosChangeRandomAmountSubMenu.height = mainMenu.height;
  monadChangeRandomAmountSubMenu.top = mainMenu.top;
  monadChangeRandomAmountSubMenu.left = mainMenu.left;
  monadChangeRandomAmountSubMenu.width = mainMenu.width;
  monadChangeRandomAmountSubMenu.height = mainMenu.height;
  safeRender();
}

screen.on("resize", adjustLayout);
adjustLayout();

async function getTokenBalance(tokenAddress, provider, wallet) {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
    const balance = await contract.balanceOf(wallet.address);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    addLog(`Gagal mengambil saldo token ${tokenAddress}: ${error.message}`, "error", currentNetwork);
    return "0";
  }
}

async function updateWalletData(network) {
  addLog(`Debug: updateWalletData menerima network = ${network}`, "debug", network || currentNetwork);
  try {
    let config;
    let normalizedNetwork = network;
    if (network === "Sepolia" || network === "Sepolia Network" || network === "Sepolia Testnet") {
      config = SEPOLIA_CONFIG;
      normalizedNetwork = "Sepolia";
    } else if (network === "Sepolia R2" || network === "Sepolia DC R2 Network" || network === "Sepolia R2 Testnet") {
      config = SEPOLIA_R2_CONFIG;
      normalizedNetwork = "Sepolia R2";
    } else if (network === "Pharos" || network === "Pharos Network") {
      config = PHRS_CONFIG;
      normalizedNetwork = "Pharos";
    } else if (network === "Monad" || network === "Monad Network") {
      config = MONAD_CONFIG;
      normalizedNetwork = "Monad";
    } else {
      throw new Error(`Jaringan tidak dikenal: ${network || 'tidak diberikan'}`);
    }

    const localProvider = new ethers.JsonRpcProvider(config.RPC_URL, undefined, { timeout: 60000 });
    const localWallet = new ethers.Wallet(process.env.PRIVATE_KEY, localProvider);

    walletInfoByNetwork[normalizedNetwork].address = localWallet.address;

    if (normalizedNetwork === "Sepolia R2") {
      const [nativeBalance, usdcBalance, r2usdBalance, r2Balance] = await Promise.all([
        localProvider.getBalance(localWallet.address),
        getTokenBalance(config.USDC_ADDRESS, localProvider, localWallet),
        getTokenBalance(config.R2USD_ADDRESS, localProvider, localWallet),
        getTokenBalance(config.R2_ADDRESS, localProvider, localWallet)
      ]);
      walletInfoByNetwork[normalizedNetwork].balanceNative = ethers.formatEther(nativeBalance);
      walletInfoByNetwork[normalizedNetwork].balanceUsdc = usdcBalance;
      walletInfoByNetwork[normalizedNetwork].balanceR2usd = r2usdBalance;
      walletInfoByNetwork[normalizedNetwork].balanceR2 = r2Balance;

      const [lpR2R2usdBalance, lpUsdcR2Balance] = await Promise.all([
        getTokenBalance(config.LP_R2_R2USD, localProvider, localWallet),
        getTokenBalance(config.LP_USDC_R2, localProvider, localWallet)
      ]);
      walletInfoByNetwork[normalizedNetwork].balanceLpR2R2usd = lpR2R2usdBalance;
      walletInfoByNetwork[normalizedNetwork].balanceLpUsdcR2 = lpUsdcR2Balance;
    } else {
      const [nativeBalance, usdcBalance, r2usdBalance, sr2usdBalance] = await Promise.all([
        localProvider.getBalance(localWallet.address),
        getTokenBalance(config.USDC_ADDRESS, localProvider, localWallet),
        getTokenBalance(config.R2USD_ADDRESS, localProvider, localWallet),
        getTokenBalance(config.sR2USD_ADDRESS, localProvider, localWallet)
      ]);
      walletInfoByNetwork[normalizedNetwork].balanceNative = ethers.formatEther(nativeBalance);
      walletInfoByNetwork[normalizedNetwork].balanceUsdc = usdcBalance;
      walletInfoByNetwork[normalizedNetwork].balanceR2usd = r2usdBalance;
      walletInfoByNetwork[normalizedNetwork].balanceSr2usd = sr2usdBalance;

      if (normalizedNetwork === "Monad") {  
        const [lpR2usdSr2usdBalance, lpUsdcR2usdBalance] = await Promise.all([
          getTokenBalance(config.LP_R2USD_sR2USD_BAL, localProvider, localWallet),
          getTokenBalance(config.LP_USDC_R2USD_BAL, localProvider, localWallet)
        ]);
        walletInfoByNetwork[normalizedNetwork].balanceLpR2usdSr2usd = lpR2usdSr2usdBalance;
        walletInfoByNetwork[normalizedNetwork].balanceLpUsdcR2usd = lpUsdcR2usdBalance;
      } else if (normalizedNetwork === "Sepolia") { 
        const [lpR2usdSr2usdBalance, lpUsdcR2usdBalance] = await Promise.all([
          getTokenBalance(config.LP_R2USD_sR2USD, localProvider, localWallet),
          getTokenBalance(config.LP_USDC_R2USD, localProvider, localWallet)
        ]);
        walletInfoByNetwork[normalizedNetwork].balanceLpR2usdSr2usd = lpR2usdSr2usdBalance;
        walletInfoByNetwork[normalizedNetwork].balanceLpUsdcR2usd = lpUsdcR2usdBalance;
      }
    }

    const currentNonce = await localProvider.getTransactionCount(localWallet.address, "pending");
    if (normalizedNetwork === "Sepolia") {
      nextNonceSepolia = currentNonce;
      addLog(`Nonce awal untuk Sepolia: ${nextNonceSepolia}`, "debug", normalizedNetwork);
    } else if (normalizedNetwork === "Sepolia R2") {
      nextNonceSepoliaR2 = currentNonce;
      addLog(`Nonce awal untuk Sepolia R2: ${nextNonceSepoliaR2}`, "debug", normalizedNetwork);
    } else if (normalizedNetwork === "Pharos") {
      nextNoncePharos = currentNonce;
      addLog(`Nonce awal untuk Pharos: ${nextNoncePharos}`, "debug", normalizedNetwork);
    } else if (normalizedNetwork === "Monad") {
      nextNonceMonad = currentNonce;
      addLog(`Nonce awal untuk Monad: ${nextNonceMonad}`, "debug", normalizedNetwork);
    }

    walletInfoByNetwork[normalizedNetwork].network = config.NETWORK_NAME;
    walletInfoByNetwork[normalizedNetwork].status = "Ready";

    if (normalizedNetwork === currentNetwork) {
      updateWallet();
    }

    addLog("Wallet Information Updated !!", "system", normalizedNetwork);
  } catch (error) {
    if (error.code === "TIMEOUT") {
      addLog(`Timeout saat mencoba menghubungi RPC ${config.RPC_URL}. Coba lagi nanti.`, "error", network || currentNetwork);
    } else {
      addLog(`Gagal mengambil data wallet: ${error.message}`, "error", network || currentNetwork);
    }
  }
}

function updateWallet() {
  const walletInfo = walletInfoByNetwork[currentNetwork];
  const shortAddress = walletInfo.address ? getShortAddress(walletInfo.address) : "N/A";
  let nativeToken;
  if (walletInfo.network === "Monad Network") {
    nativeToken = "MON";
  } else if (walletInfo.network === "Pharos Network") {
    nativeToken = "PHRS";
  } else {
    nativeToken = "ETH";
  }
  const nativeBalance = walletInfo.balanceNative ? Number(walletInfo.balanceNative).toFixed(4) : "0.0000";
  const usdc = walletInfo.balanceUsdc ? Number(walletInfo.balanceUsdc).toFixed(2) : "0.00";
  const r2usd = walletInfo.balanceR2usd ? Number(walletInfo.balanceR2usd).toFixed(4) : "0.0000";

  let tokenBalances = '';
  if (walletInfo.network === "Sepolia R2 Testnet") {
    const r2 = walletInfo.balanceR2 ? Number(walletInfo.balanceR2).toFixed(4) : "0.0000";
    const lpR2R2usd = walletInfo.balanceLpR2R2usd ? Number(walletInfo.balanceLpR2R2usd).toFixed(6) : "0.00000";
    const lpUsdcR2 = walletInfo.balanceLpUsdcR2 ? Number(walletInfo.balanceLpUsdcR2).toFixed(6) : "0.00000";
    tokenBalances = `│   ├── R2             : {bright-green-fg}${r2}{/bright-green-fg}\n` +
                    `│   ├── LP R2-R2USD    : {bright-green-fg}${lpR2R2usd}{/bright-green-fg}\n` +
                    `│   └── LP USDC-R2     : {bright-green-fg}${lpUsdcR2}{/bright-green-fg}\n`;
  } else {
    const sr2usd = walletInfo.balanceSr2usd ? Number(walletInfo.balanceSr2usd).toFixed(6) : "0.000000";
    const lpR2usdSr2usd = walletInfo.network === "Pharos Network" ? "N/A" : (walletInfo.balanceLpR2usdSr2usd ? Number(walletInfo.balanceLpR2usdSr2usd).toFixed(12) : "0.000000000000");
    const lpUsdcR2usd = walletInfo.network === "Pharos Network" ? "N/A" : (walletInfo.balanceLpUsdcR2usd ? Number(walletInfo.balanceLpUsdcR2usd).toFixed(12) : "0.000000000000");
    tokenBalances = `│   ├── sR2USD          : {bright-green-fg}${sr2usd}{/bright-green-fg}\n` +
                    `│   ├── LP R2USD-sR2USD : {bright-green-fg}${lpR2usdSr2usd}{/bright-green-fg}\n` +
                    `│   └── LP USDC-R2USD   : {bright-green-fg}${lpUsdcR2usd}{/bright-green-fg}\n`;
  }

  const content = `┌── Address   : {bright-yellow-fg}${shortAddress}{/bright-yellow-fg}\n` +
                  `│   ├── ${nativeToken}           : {bright-green-fg}${nativeBalance}{/bright-green-fg}\n` +
                  `│   ├── USDC            : {bright-green-fg}${usdc}{/bright-green-fg}\n` +
                  `│   ├── R2USD           : {bright-green-fg}${r2usd}{/bright-green-fg}\n` +
                  tokenBalances +
                  `└── Network        : {bright-cyan-fg}${walletInfo.network}{/bright-cyan-fg}`;
  walletBox.setContent(content);
  safeRender();
}

async function ensureApproval(tokenAddress, spender, amount, wallet, network) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, wallet);
  let allowance = await tokenContract.allowance(wallet.address, spender);
  addLog(`Allowance saat ini untuk ${spender}: ${ethers.formatUnits(allowance, 6)}`, "debug", network);
  allowance = BigInt(allowance.toString());
  const amountBigInt = BigInt(amount.toString());

  if (allowance < amountBigInt) {
    const approveAmount = ethers.parseUnits("1000000", 6);
    addLog(`Approving ${ethers.formatUnits(approveAmount, 6)} tokens untuk ${spender}`, "system", network);
    const approveTx = await tokenContract.approve(spender, approveAmount);
    await approveTx.wait();
    addLog(`Approval berhasil untuk ${spender}`, "success", network);
  } else {
    addLog(`Allowance cukup untuk ${spender}`, "debug", network);
  }
}

async function checkContractPaused(contractAddress, provider, network) {
  const contract = new ethers.Contract(contractAddress, [
    "function paused() view returns (bool)"
  ], provider);
  try {
    const paused = await contract.paused();
    addLog(`Status paused kontrak ${contractAddress}: ${paused}`, "debug", network);
    return paused;
  } catch (error) {
    addLog(`Kontrak ${contractAddress} tidak memiliki fungsi paused() atau gagal: ${error.message}`, "warning", network);
    return false;
  }
}

async function swapTokens(amount, tokenIn, tokenOut, nonce, wallet, provider, config) {
  const network = config.NETWORK_NAME;
  const routerAddress = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

  const tokenInContract = new ethers.Contract(tokenIn, ERC20ABI, provider);
  const tokenOutContract = new ethers.Contract(tokenOut, ERC20ABI, provider);

  const balanceIn = await tokenInContract.balanceOf(wallet.address);
  if (BigInt(balanceIn.toString()) < BigInt(amount.toString())) {
    throw new Error(`Saldo ${tokenIn} tidak cukup`);
  }

  await ensureApproval(tokenIn, routerAddress, amount, wallet, network);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; 
  const amountOutMin = 0; 

  const routerContract = new ethers.Contract(routerAddress, [
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[])"
  ], wallet);

  const path = [tokenIn, tokenOut];

  const tx = await routerContract.swapExactTokensForTokens(
    amount,
    amountOutMin,
    path,
    wallet.address,
    deadline,
    { nonce: nonce }
  );

  return tx;
}

async function autoSwapR2Usdc(network) {
  const ranges = randomAmountRanges["SWAP_R2_USDC"];
  let amount;
  let txPromise;
  let currentDirection = swapDirection[network];

  if (currentDirection) {
    amount = getRandomNumber(ranges["R2"].min, ranges["R2"].max).toFixed(18);
    addLog(`Mencoba swap: ${amount} R2 ke USDC`, "swap", network);
    try {
      txPromise = addTransactionToQueue(
        (nonce, wallet, provider, config) => swapTokens(ethers.parseUnits(amount, 18), config.R2_ADDRESS, config.USDC_ADDRESS, nonce, wallet, provider, config),
        `Swap ${amount} R2 to USDC`,
        network
      );
    } catch (error) {
      if (error.message.includes("Saldo R2 tidak cukup")) {
        addLog("Saldo R2 tidak cukup, mencoba swap USDC ke R2", "warning", network);
        amount = getRandomNumber(ranges["USDC"].min, ranges["USDC"].max).toFixed(6);
        txPromise = addTransactionToQueue(
          (nonce, wallet, provider, config) => swapTokens(ethers.parseUnits(amount, 6), config.USDC_ADDRESS, config.R2_ADDRESS, nonce, wallet, provider, config),
          `Swap ${amount} USDC to R2`,
          network
        );
      } else {
        throw error;
      }
    }
  } else {
    amount = getRandomNumber(ranges["USDC"].min, ranges["USDC"].max).toFixed(6);
    addLog(`Mencoba swap: ${amount} USDC ke R2`, "swap", network);
    try {
      txPromise = addTransactionToQueue(
        (nonce, wallet, provider, config) => swapTokens(ethers.parseUnits(amount, 6), config.USDC_ADDRESS, config.R2_ADDRESS, nonce, wallet, provider, config),
        `Swap ${amount} USDC to R2`,
        network
      );
    } catch (error) {
      if (error.message.includes("Saldo USDC tidak cukup")) {
        addLog("Saldo USDC tidak cukup, mencoba swap R2 ke USDC", "warning", network);
        amount = getRandomNumber(ranges["R2"].min, ranges["R2"].max).toFixed(18);
        txPromise = addTransactionToQueue(
          (nonce, wallet, provider, config) => swapTokens(ethers.parseUnits(amount, 18), config.R2_ADDRESS, config.USDC_ADDRESS, nonce, wallet, provider, config),
          `Swap ${amount} R2 to USDC`,
          network
        );
      } else {
        throw error;
      }
    }
  }

  try {
    const result = await txPromise;
    if (result && result.receipt && result.receipt.status === 1) {
      swapDirection[network] = !currentDirection;
      addLog(`Arah swap diubah menjadi: ${swapDirection[network] ? "R2 -> USDC" : "USDC -> R2"}`, "debug", network);
    }
    return result;
  } catch (error) {
    addLog(`Swap gagal: ${error.message}`, "error", network);
    return null;
  }
}

async function autoSwapR2R2usd(network) {
  const ranges = randomAmountRanges["SWAP_R2_R2USD"];
  let amount;
  let txPromise;
  let currentDirection = swapDirection[network];

  if (currentDirection) {
    amount = getRandomNumber(ranges["R2"].min, ranges["R2"].max).toFixed(4);
    addLog(`Mencoba swap: ${amount} R2 ke R2USD`, "swap", network);
    try {
      txPromise = addTransactionToQueue(
        (nonce, wallet, provider, config) => swapTokens(ethers.parseUnits(amount, 18), config.R2_ADDRESS, config.R2USD_ADDRESS, nonce, wallet, provider, config),
        `Swap ${amount} R2 to R2USD`,
        network
      );
    } catch (error) {
      if (error.message.includes("Saldo R2 tidak cukup")) {
        addLog("Saldo R2 tidak cukup, mencoba swap R2USD ke R2", "warning", network);
        amount = getRandomNumber(ranges["R2USD"].min, ranges["R2USD"].max).toFixed(4);
        txPromise = addTransactionToQueue(
          (nonce, wallet, provider, config) => swapTokens(ethers.parseUnits(amount, 6), config.R2USD_ADDRESS, config.R2_ADDRESS, nonce, wallet, provider, config),
          `Swap ${amount} R2USD to R2`,
          network
        );
      } else {
        throw error;
      }
    }
  } else {
    amount = getRandomNumber(ranges["R2USD"].min, ranges["R2USD"].max).toFixed(6);
    addLog(`Mencoba swap: ${amount} R2USD ke R2`, "swap", network);
    try {
      txPromise = addTransactionToQueue(
        (nonce, wallet, provider, config) => swapTokens(ethers.parseUnits(amount, 6), config.R2USD_ADDRESS, config.R2_ADDRESS, nonce, wallet, provider, config),
        `Swap ${amount} R2USD to R2`,
        network
      );
    } catch (error) {
      if (error.message.includes("Saldo R2USD tidak cukup")) {
        addLog("Saldo R2USD tidak cukup, mencoba swap R2 ke R2USD", "warning", network);
        amount = getRandomNumber(ranges["R2"].min, ranges["R2"].max).toFixed(4);
        txPromise = addTransactionToQueue(
          (nonce, wallet, provider, config) => swapTokens(ethers.parseUnits(amount, 18), config.R2_ADDRESS, config.R2USD_ADDRESS, nonce, wallet, provider, config),
          `Swap ${amount} R2 to R2USD`,
          network
        );
      } else {
        throw error;
      }
    }
  }

  try {
    const result = await txPromise;
    if (result && result.receipt && result.receipt.status === 1) {
      swapDirection[network] = !currentDirection;
      addLog(`Arah swap diubah menjadi: ${swapDirection[network] ? "R2 -> R2USD" : "R2USD -> R2"}`, "debug", network);
    }
    return result;
  } catch (error) {
    addLog(`Swap gagal: ${error.message}`, "error", network);
    return null;
  }
}

async function autoAddLpR2Usdc(amountR2, nonce, wallet, provider, config) {
  const network = config.NETWORK_NAME;
  const routerAddress = config.ROUTER_ADDRESS;
  if (!routerAddress) {
    throw new Error("Router address tidak valid atau tidak didefinisikan di config");
  }

  const r2Contract = new ethers.Contract(config.R2_ADDRESS, ERC20ABI, provider);
  const usdcContract = new ethers.Contract(config.USDC_ADDRESS, ERC20ABI, provider);

  const balanceR2 = await r2Contract.balanceOf(wallet.address);
  const balanceUsdc = await usdcContract.balanceOf(wallet.address);

  const amountR2Wei = ethers.parseUnits(amountR2.toString(), 18);
  if (BigInt(balanceR2.toString()) < BigInt(amountR2Wei.toString())) {
    throw new Error(`Saldo R2 tidak cukup: ${ethers.formatUnits(balanceR2, 18)} R2`);
  }

  const amountUsdc = (parseFloat(amountR2) * 150.041216 / 100).toFixed(6);
  const amountUsdcWei = ethers.parseUnits(amountUsdc, 6);
  if (BigInt(balanceUsdc.toString()) < BigInt(amountUsdcWei.toString())) {
    throw new Error(`Saldo USDC tidak cukup: ${ethers.formatUnits(balanceUsdc, 6)} USDC`);
  }

  await ensureApproval(config.R2_ADDRESS, routerAddress, amountR2Wei, wallet, network);
  await ensureApproval(config.USDC_ADDRESS, routerAddress, amountUsdcWei, wallet, network);

  const routerContract = new ethers.Contract(routerAddress, [
    "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)"
  ], wallet);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const amountAMin = ethers.parseUnits((parseFloat(amountR2) * 0.99).toFixed(4), 6);
  const amountBMin = ethers.parseUnits((parseFloat(amountUsdc) * 0.99).toFixed(4), 6);

  const tx = await routerContract.addLiquidity(
    config.R2_ADDRESS,
    config.USDC_ADDRESS,
    amountR2Wei,
    amountUsdcWei,
    amountAMin,
    amountBMin,
    wallet.address,
    deadline,
    { nonce: nonce, gasLimit: 500000 }
  );

  return tx;
}

async function autoAddLpR2R2usd(amountR2, nonce, wallet, provider, config) {
  const network = config.NETWORK_NAME;
  const routerAddress = config.ROUTER_ADDRESS;
  if (!routerAddress) {
    throw new Error("Router address tidak valid atau tidak didefinisikan di config");
  }

  const r2Contract = new ethers.Contract(config.R2_ADDRESS, ERC20ABI, provider);
  const r2usdContract = new ethers.Contract(config.R2USD_ADDRESS, ERC20ABI, provider);

  const balanceR2 = await r2Contract.balanceOf(wallet.address);
  const balanceR2usd = await r2usdContract.balanceOf(wallet.address);

  const amountR2Wei = ethers.parseUnits(amountR2.toString(), 18);
  if (BigInt(balanceR2.toString()) < BigInt(amountR2Wei.toString())) {
    throw new Error(`Saldo R2 tidak cukup: ${ethers.formatUnits(balanceR2, 18)} R2`);
  }

  const amountR2usd = (parseFloat(amountR2) * 148.427749 / 100).toFixed(6);
  const amountR2usdWei = ethers.parseUnits(amountR2usd, 6);
  if (BigInt(balanceR2usd.toString()) < BigInt(amountR2usdWei.toString())) {
    throw new Error(`Saldo R2USD tidak cukup: ${ethers.formatUnits(balanceR2usd, 6)} R2USD`);
  }

  await ensureApproval(config.R2_ADDRESS, routerAddress, amountR2Wei, wallet, network);
  await ensureApproval(config.R2USD_ADDRESS, routerAddress, amountR2usdWei, wallet, network);

  const routerContract = new ethers.Contract(routerAddress, [
    "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)"
  ], wallet);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const amountAMin = ethers.parseUnits((parseFloat(amountR2) * 0.99).toFixed(4), 6);
  const amountBMin = ethers.parseUnits((parseFloat(amountR2usd) * 0.99).toFixed(4), 6);

  const tx = await routerContract.addLiquidity(
    config.R2_ADDRESS,
    config.R2USD_ADDRESS,
    amountR2Wei,
    amountR2usdWei,
    amountAMin,
    amountBMin,
    wallet.address,
    deadline,
    { nonce: nonce, gasLimit: 500000 }
  );

  return tx;
}

async function swapUsdcToR2usd(amountUsdc, nonce, wallet, provider, config) {
  const network = config.NETWORK_NAME;
  const amount = ethers.parseUnits(amountUsdc.toString(), 6);
  const routerContractAddress = config.ROUTER_USDC_TO_R2USD;

  const isPaused = await checkContractPaused(routerContractAddress, provider, network);
  if (isPaused) {
    throw new Error("Kontrak dalam status paused, swap tidak dapat dilakukan");
  }

  const usdcContract = new ethers.Contract(config.USDC_ADDRESS, ERC20ABI, provider);
  let balance = await usdcContract.balanceOf(wallet.address);
  addLog(`Saldo USDC: ${ethers.formatUnits(balance, 6)}, Tipe: ${typeof balance}`, "debug", network);

  balance = BigInt(balance.toString());
  const amountBigInt = BigInt(amount.toString());

  if (balance < amountBigInt) {
    throw new Error(`Saldo USDC tidak cukup: ${ethers.formatUnits(balance, 6)} USDC`);
  }

  await ensureApproval(config.USDC_ADDRESS, routerContractAddress, amount, wallet, network);

  const methodId = "0x095e7a95";
  const data = ethers.concat([
    methodId,
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
      [wallet.address, amount, 0, 0, 0, 0, 0]
    ),
  ]);

  addLog(`Data transaksi: ${data}`, "debug", network);

  try {
    await provider.call({
      to: routerContractAddress,
      data,
      from: wallet.address,
    });
    addLog("Simulasi transaksi berhasil, melanjutkan ke pengiriman", "debug", network);
  } catch (error) {
    throw new Error(`Simulasi transaksi gagal: ${error.reason || error.message}`);
  }

  const tx = await wallet.sendTransaction({
    to: routerContractAddress,
    data: data,
    gasLimit: 500000,
    nonce: nonce,
  });

  return tx;
}

async function swapR2usdToUsdC(amountR2usd, nonce, wallet, provider, config) {
  const network = config.NETWORK_NAME;
  const amount = ethers.parseUnits(amountR2usd.toString(), 6);
  const routerContractAddress = config.ROUTER_R2USD_TO_USDC;

  const r2usdContract = new ethers.Contract(config.R2USD_ADDRESS, ERC20ABI, provider);
  let balance = await r2usdContract.balanceOf(wallet.address);
  addLog(`Saldo R2USD: ${ethers.formatUnits(balance, 6)}, Tipe: ${typeof balance}`, "debug", network);

  balance = BigInt(balance.toString());
  const amountBigInt = BigInt(amount.toString());

  if (balance < amountBigInt) {
    throw new Error(`Saldo R2USD tidak cukup: ${ethers.formatUnits(balance, 6)} R2USD`);
  }

  const methodId = "0x9dc29fac";
  const data = ethers.concat([
    methodId,
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256"],
      [wallet.address, amount]
    ),
  ]);

  addLog(`Data transaksi: ${data}`, "debug", network);

  try {
    await provider.call({
      to: routerContractAddress,
      data,
      from: wallet.address,
    });
    addLog("Simulasi transaksi burn berhasil, melanjutkan ke pengiriman", "debug", network);
  } catch (error) {
    throw new Error(`Simulasi transaksi burn gagal: ${error.reason || error.message}`);
  }

  const tx = await wallet.sendTransaction({
    to: routerContractAddress,
    data: data,
    gasLimit: 500000,
    nonce: nonce,
  });

  return tx;
}

async function swapR2usdToUsdc(amountR2usd, nonce, wallet, provider, config) {
  const network = config.NETWORK_NAME;
  const amount = ethers.parseUnits(amountR2usd.toString(), 6);
  const routerContractAddress = config.ROUTER_R2USD_TO_USDC;

  const r2usdContract = new ethers.Contract(config.R2USD_ADDRESS, ERC20ABI, provider);
  let balance = await r2usdContract.balanceOf(wallet.address);
  addLog(`Saldo R2USD: ${ethers.formatUnits(balance, 6)}, Tipe: ${typeof balance}`, "debug", network);

  balance = BigInt(balance.toString());
  const amountBigInt = BigInt(amount.toString());

  if (balance < amountBigInt) {
    throw new Error(`Saldo R2USD tidak cukup: ${ethers.formatUnits(balance, 6)} R2USD`);
  }

  await ensureApproval(config.R2USD_ADDRESS, routerContractAddress, amount, wallet, network);

  const slippage = 0.97;
  const minDyAmount = (parseFloat(amountR2usd) * slippage).toFixed(6);
  const minDy = ethers.parseUnits(minDyAmount, 6);

  addLog(`minDy setelah slippage: ${minDyAmount} USDC`, "debug", network);

  const methodId = "0x3df02124";
  const data = ethers.concat([
    methodId,
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["int128", "int128", "uint256", "uint256"],
      [0, 1, amount, minDy]
    ),
  ]);

  addLog(`Data transaksi: ${data}`, "debug", network);

  try {
    await provider.call({
      to: routerContractAddress,
      data,
      from: wallet.address,
    });
    addLog("Simulasi transaksi berhasil, melanjutkan ke pengiriman", "debug", network);
  } catch (error) {
    throw new Error(`Simulasi transaksi gagal: ${error.reason || error.message}`);
  }

  const tx = await wallet.sendTransaction({
    to: routerContractAddress,
    data: data,
    gasLimit: 500000,
    nonce: nonce,
  });

  return tx;
}

async function autoSwapR2usdUsdc(network) {
  const ranges = randomAmountRanges["SWAP_R2USD_USDC"];
  let amount;
  let txPromise;
  let currentDirection = swapDirection[network];

  if (currentDirection) {
    amount = getRandomNumber(ranges["USDC"].min, ranges["USDC"].max).toFixed(6);
    addLog(`Mencoba swap: ${amount} USDC ke R2USD`, "swap", network);
    try {
      txPromise = addTransactionToQueue(
        (nonce, wallet, provider, config) => swapUsdcToR2usd(amount, nonce, wallet, provider, config),
        `Swap ${amount} USDC to R2USD`,
        network
      );
    } catch (error) {
      if (error.message.includes("Saldo USDC tidak cukup")) {
        addLog("Saldo USDC tidak cukup, mencoba swap R2USD ke USDC", "warning", network);
        amount = getRandomNumber(ranges["R2USD"].min, ranges["R2USD"].max).toFixed(6);
        if (network === "Pharos" || network === "Monad") {
          txPromise = addTransactionToQueue(
            (nonce, wallet, provider, config) => swapR2usdToUsdC(amount, nonce, wallet, provider, config),
            `Swap ${amount} R2USD to USDC`,
            network
          );
        } else {
          txPromise = addTransactionToQueue(
            (nonce, wallet, provider, config) => swapR2usdToUsdc(amount, nonce, wallet, provider, config),
            `Swap ${amount} R2USD to USDC`,
            network
          );
        }
      } else {
        throw error;
      }
    }
  } else {
    amount = getRandomNumber(ranges["R2USD"].min, ranges["R2USD"].max).toFixed(6);
    addLog(`Mencoba swap: ${amount} R2USD ke USDC`, "swap", network);
    try {
      if (network === "Pharos" || network === "Monad") {
        txPromise = addTransactionToQueue(
          (nonce, wallet, provider, config) => swapR2usdToUsdC(amount, nonce, wallet, provider, config),
          `Swap ${amount} R2USD to USDC`,
          network
        );
      } else {
        txPromise = addTransactionToQueue(
          (nonce, wallet, provider, config) => swapR2usdToUsdc(amount, nonce, wallet, provider, config),
          `Swap ${amount} R2USD to USDC`,
          network
        );
      }
    } catch (error) {
      if (error.message.includes("Saldo R2USD tidak cukup")) {
        addLog("Saldo R2USD tidak cukup, mencoba swap USDC ke R2USD", "warning", network);
        amount = getRandomNumber(ranges["USDC"].min, ranges["USDC"].max).toFixed(6);
        txPromise = addTransactionToQueue(
          (nonce, wallet, provider, config) => swapUsdcToR2usd(amount, nonce, wallet, provider, config),
          `Swap ${amount} USDC to R2USD`,
          network
        );
      } else {
        throw error;
      }
    }
  }

  try {
    const result = await txPromise;
    if (result && result.receipt && result.receipt.status === 1) {
      swapDirection[network] = !currentDirection;
      addLog(`Arah swap diubah menjadi: ${swapDirection[network] ? "USDC -> R2USD" : "R2USD -> USDC"}`, "debug", network);
    }
    return result;
  } catch (error) {
    addLog(`Swap gagal: ${error.message}`, "error", network);
    return null;
  }
}

async function autoStakeR2usdSr2usd(amountR2usd, nonce, wallet, provider, config) {
  const network = config.NETWORK_NAME;
  const amount = parseFloat(amountR2usd);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Jumlah R2USD harus lebih besar dari 0");
  }

  const amountWei = ethers.parseUnits(amount.toString(), 6);
  const stakingContractAddress = config.STAKING_CONTRACT;

  const r2usdContract = new ethers.Contract(config.R2USD_ADDRESS, ERC20ABI, provider);
  let balance = await r2usdContract.balanceOf(wallet.address);
  addLog(`Saldo R2USD: ${ethers.formatUnits(balance, 6)}, Tipe: ${typeof balance}`, "debug", network);

  balance = BigInt(balance.toString());
  const amountBigInt = BigInt(amountWei.toString());

  if (balance < amountBigInt) {
    throw new Error(`Saldo R2USD tidak cukup: ${ethers.formatUnits(balance, 6)} R2USD`);
  }

  await ensureApproval(config.R2USD_ADDRESS, stakingContractAddress, amountWei, wallet, network);

  const methodId = "0x1a5f0f00";
  const data = ethers.concat([
    methodId,
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256", "uint256", "uint8", "uint256", "uint256"],
      [amountWei, 0, 0, 0, 0, 0]
    ),
  ]);

  addLog(`Data transaksi: ${data}`, "debug", network);

  try {
    await provider.call({
      to: stakingContractAddress,
      data,
      from: wallet.address,
    });
    addLog("Simulasi transaksi staking berhasil, melanjutkan ke pengiriman", "debug", network);
  } catch (error) {
    throw new Error(`Simulasi transaksi staking gagal: ${error.reason || error.message}`);
  }

  const tx = await wallet.sendTransaction({
    to: stakingContractAddress,
    data: data,
    gasLimit: 500000,
    nonce: nonce,
  });

  return tx;
}

async function autoAddLpR2usdSr2usd(amountR2usd, nonce, wallet, provider, config) {
  if (!config) {
    throw new Error("Config tidak didefinisikan");
  }
  const network = config.NETWORK_NAME;
  addLog(`Menambahkan LP untuk ${amountR2usd} R2USD`, "debug", network);
  const amount = parseFloat(amountR2usd);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Jumlah R2USD harus lebih besar dari 0");
  }

  const amountWei = ethers.parseUnits(amount.toString(), 6);
  const amountSr2usdWei = amountWei;
  const lpContractAddress = config.LP_R2USD_sR2USD;

  const r2usdContract = new ethers.Contract(config.R2USD_ADDRESS, ERC20ABI, provider);
  const sr2usdContract = new ethers.Contract(config.sR2USD_ADDRESS, ERC20ABI, provider);

  let balanceR2usd = await r2usdContract.balanceOf(wallet.address);
  let balanceSr2usd = await sr2usdContract.balanceOf(wallet.address);

  addLog(`Saldo R2USD: ${ethers.formatUnits(balanceR2usd, 6)}`, "debug", network);
  addLog(`Saldo sR2USD: ${ethers.formatUnits(balanceSr2usd, 6)}`, "debug", network);

  balanceR2usd = BigInt(balanceR2usd.toString());
  balanceSr2usd = BigInt(balanceSr2usd.toString());
  const amountBigInt = BigInt(amountWei.toString());

  if (balanceR2usd < amountBigInt) {
    throw new Error(`Saldo R2USD tidak cukup: ${ethers.formatUnits(balanceR2usd, 6)} R2USD`);
  }
  if (balanceSr2usd < amountBigInt) {
    throw new Error(`Saldo sR2USD tidak cukup: ${ethers.formatUnits(balanceSr2usd, 6)} sR2USD`);
  }

  await ensureApproval(config.R2USD_ADDRESS, lpContractAddress, amountWei, wallet, network);
  await ensureApproval(config.sR2USD_ADDRESS, lpContractAddress, amountSr2usdWei, wallet, network);

  let txData;
  const lpContractWithSigner = new ethers.Contract(lpContractAddress, network === "Monad Network" ? UNISWAP_V2_LP_ABI : LP_CONTRACT_ABI, wallet);

  if (network === "Monad Network") {
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; 
    const slippageTolerance = 0.99;
    const amountR2usdMin = BigInt(Math.floor(amount * slippageTolerance * 10**6));
    const amountSr2usdMin = BigInt(Math.floor(amount * slippageTolerance * 10**6));

    txData = await lpContractWithSigner.addLiquidity.populateTransaction(
      config.R2USD_ADDRESS,
      config.sR2USD_ADDRESS,
      amountWei,
      amountSr2usdWei,
      amountR2usdMin,
      amountSr2usdMin,
      wallet.address,
      deadline
    );
    addLog(`Data transaksi: ${txData.data}`, "debug", network);
  } else {
    const lpContract = new ethers.Contract(lpContractAddress, LP_CONTRACT_ABI, provider);
    let estimatedLpTokens;
    try {
      estimatedLpTokens = await lpContract.calc_token_amount([amountSr2usdWei, amountWei], true);
      addLog(`Estimasi LP token: ${ethers.formatUnits(estimatedLpTokens, 18)}`, "debug", network);
    } catch (error) {
      addLog(`Gagal mengestimasi LP token: ${error.message}, menggunakan _min_mint_amount=0`, "warning", network);
      estimatedLpTokens = 0;
    }

    const slippageTolerance = 0.99;
    const minMintAmount = estimatedLpTokens === 0 ? 0 : BigInt(Math.floor(Number(estimatedLpTokens) * slippageTolerance));

    txData = await lpContractWithSigner.add_liquidity.populateTransaction(
      [amountSr2usdWei, amountWei],
      minMintAmount,
      wallet.address
    );
    addLog(`Data transaksi: ${txData.data}`, "debug", network);
  }

  try {
    await provider.call({
      to: lpContractAddress,
      data: txData.data,
      from: wallet.address,
    });
    addLog("Simulasi transaksi add liquidity berhasil", "debug", network);
  } catch (error) {
    throw new Error(`Simulasi transaksi add liquidity gagal: ${error.reason || error.message}`);
  }

  const tx = await wallet.sendTransaction({
    to: lpContractAddress,
    data: txData.data,
    gasLimit: 500000,
    nonce: nonce,
  });

  return tx;
}



async function autoAddLpUsdcR2usd(amountUsdc, nonce, wallet, provider, config) {
  if (!config) {
    throw new Error("Config tidak didefinisikan");
  }
  const network = config.NETWORK_NAME;
  addLog(`Menambahkan LP untuk ${amountUsdc} USDC`, "debug", network);
  const amount = parseFloat(amountUsdc);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Jumlah USDC harus lebih besar dari 0");
  }

  const amountWei = ethers.parseUnits(amount.toString(), 6);
  const amountR2usdWei = amountWei;
  const lpContractAddress = config.LP_USDC_R2USD;

  const usdcContract = new ethers.Contract(config.USDC_ADDRESS, ERC20ABI, provider);
  const r2usdContract = new ethers.Contract(config.R2USD_ADDRESS, ERC20ABI, provider);

  let balanceUsdc = await usdcContract.balanceOf(wallet.address);
  let balanceR2usd = await r2usdContract.balanceOf(wallet.address);

  addLog(`Saldo USDC: ${ethers.formatUnits(balanceUsdc, 6)}`, "debug", network);
  addLog(`Saldo R2USD: ${ethers.formatUnits(balanceR2usd, 6)}`, "debug", network);

  balanceUsdc = BigInt(balanceUsdc.toString());
  balanceR2usd = BigInt(balanceR2usd.toString());
  const amountBigInt = BigInt(amountWei.toString());

  if (balanceUsdc < amountBigInt) {
    throw new Error(`Saldo USDC tidak cukup: ${ethers.formatUnits(balanceUsdc, 6)} USDC`);
  }
  if (balanceR2usd < amountBigInt) {
    throw new Error(`Saldo R2USD tidak cukup: ${ethers.formatUnits(balanceR2usd, 6)} R2USD`);
  }

  await ensureApproval(config.USDC_ADDRESS, lpContractAddress, amountWei, wallet, network);
  await ensureApproval(config.R2USD_ADDRESS, lpContractAddress, amountR2usdWei, wallet, network);

  let txData;
  const lpContractWithSigner = new ethers.Contract(lpContractAddress, network === "Monad Network" ? UNISWAP_V2_LP_ABI : LP_USDC_R2USD_ABI, wallet);

  if (network === "Monad Network") {
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const slippageTolerance = 0.99;
    const amountUsdcMin = BigInt(Math.floor(amount * slippageTolerance * 10**6));
    const amountR2usdMin = BigInt(Math.floor(amount * slippageTolerance * 10**6));

    txData = await lpContractWithSigner.addLiquidity.populateTransaction(
      config.USDC_ADDRESS,
      config.R2USD_ADDRESS,
      amountWei,
      amountR2usdWei,
      amountUsdcMin,
      amountR2usdMin,
      wallet.address,
      deadline
    );
    addLog(`Data transaksi: ${txData.data}`, "debug", network);
  } else {
    const lpContract = new ethers.Contract(lpContractAddress, LP_USDC_R2USD_ABI, provider);
    let estimatedLpTokens;
    try {
      estimatedLpTokens = await lpContract.calc_token_amount([amountR2usdWei, amountWei], true);
      addLog(`Estimasi LP token: ${ethers.formatUnits(estimatedLpTokens, 18)}`, "debug", network);
    } catch (error) {
      addLog(`Gagal mengestimasi LP token: ${error.message}, menggunakan _min_mint_amount=0`, "warning", network);
      estimatedLpTokens = 0;
    }

    const slippageTolerance = 0.99;
    const minMintAmount = estimatedLpTokens === 0 ? 0 : BigInt(Math.floor(Number(estimatedLpTokens) * slippageTolerance));

    txData = await lpContractWithSigner.add_liquidity.populateTransaction(
      [amountR2usdWei, amountWei],
      minMintAmount,
      wallet.address
    );
    addLog(`Data transaksi: ${txData.data}`, "debug", network);
  }

  try {
    await provider.call({
      to: lpContractAddress,
      data: txData.data,
      from: wallet.address,
    });
    addLog("Simulasi transaksi add liquidity berhasil", "debug", network);
  } catch (error) {
    throw new Error(`Simulasi transaksi add liquidity gagal: ${error.reason || error.message}`);
  }

  const tx = await wallet.sendTransaction({
    to: lpContractAddress,
    data: txData.data,
    gasLimit: 500000,
    nonce: nonce,
  });

  return tx;
}

async function runAutoAction(actionFunction, actionName, network) {
  addLog(`Debug: runAutoAction menerima network = ${network}`, "debug", network || currentNetwork);
  let normalizedNetwork = network;
  if (!network) {
    addLog("Peringatan: Parameter network tidak diberikan, menggunakan currentNetwork", "warning", currentNetwork);
    normalizedNetwork = currentNetwork;
  }
  if (normalizedNetwork === "Sepolia Testnet") normalizedNetwork = "Sepolia";
  else if (normalizedNetwork === "Sepolia R2 Testnet") normalizedNetwork = "Sepolia R2";
  else if (normalizedNetwork === "Pharos Network") normalizedNetwork = "Pharos";
  else if (normalizedNetwork === "Monad Network") normalizedNetwork = "Monad";

  const swapRunning = normalizedNetwork === "Sepolia" ? swapRunningSepolia :
                      normalizedNetwork === "Sepolia R2" ? swapRunningSepoliaR2 :
                      normalizedNetwork === "Pharos" ? swapRunningPharos :
                      normalizedNetwork === "Monad" ? swapRunningMonad : false;

  if (swapRunning) {
    addLog("Transaksi sedang berjalan di jaringan ini. Hentikan transaksi terlebih dahulu.", "warning", normalizedNetwork);
    return;
  }

  promptBox.setFront();
  if (actionName.includes("Stake") || actionName.includes("Add LP")) {
    const tokenPrompt = actionName.includes("R2 & USDC") ? "R2" :
                       actionName.includes("USDC & R2USD") ? "USDC" : "R2USD";
    promptBox.input(`Masukkan jumlah ${tokenPrompt} untuk ${actionName}`, "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog(`${actionName}: Input tidak valid atau dibatalkan.`, "swap", normalizedNetwork);
        return;
      }
      const amount = parseFloat(value);
      if (isNaN(amount) || amount <= 0) {
        addLog(`${actionName}: Jumlah harus berupa angka lebih besar dari 0.`, "swap", normalizedNetwork);
        return;
      }
      addLog(`${actionName}: Mulai ${actionName.includes("Stake") ? "staking" : "menambahkan LP"} ${amount} ${tokenPrompt}.`, "swap", normalizedNetwork);

      if (normalizedNetwork === "Sepolia") {
        swapRunningSepolia = true;
        addLog("swapRunningSepolia diatur ke true", "debug", normalizedNetwork);
      } else if (normalizedNetwork === "Sepolia R2") {
        swapRunningSepoliaR2 = true;
        addLog("swapRunningSepoliaR2 diatur ke true", "debug", normalizedNetwork);
      } else if (normalizedNetwork === "Pharos") {
        swapRunningPharos = true;
        addLog("swapRunningPharos diatur ke true", "debug", normalizedNetwork);
      } else if (normalizedNetwork === "Monad") {
        swapRunningMonad = true;
        addLog("swapRunningMonad diatur ke true", "debug", normalizedNetwork);
      } 

      mainMenu.setItems(getMainMenItems());
      const activeSubMenu = normalizedNetwork === "Sepolia" ? sepoliaSubMenu :
                            normalizedNetwork === "Sepolia R2" ? r2SepoliaSubMenu :
                            normalizedNetwork === "Pharos" ? pharosSubMenu :
                            monadSubMenu;
      activeSubMenu.setItems(normalizedNetwork === "Sepolia" ? getSepoliaSubMenuItems() :
                            normalizedNetwork === "Sepolia R2" ? getSepoliaR2SubMenuItems() :
                            normalizedNetwork === "Pharos" ? getPharosSubMenuItems() :
                            getMonadSubMenuItems());
      activeSubMenu.show();
      activeSubMenu.focus();
      safeRender();

      try {
        const selectedFunction = actionName.includes("Stake") ? 
          (nonce, wallet, provider, config) => autoStakeR2usdSr2usd(amount, nonce, wallet, provider, config) :
          actionName.includes("USDC & R2USD") ? 
            (nonce, wallet, provider, config) => autoAddLpUsdcR2usd(amount, nonce, wallet, provider, config) :
          actionName.includes("R2 & USDC") ? 
            (nonce, wallet, provider, config) => autoAddLpR2Usdc(amount, nonce, wallet, provider, config) :
          actionName.includes("R2 & R2USD") ? 
            (nonce, wallet, provider, config) => autoAddLpR2R2usd(amount, nonce, wallet, provider, config) :
          (nonce, wallet, provider, config) => autoAddLpR2usdSr2usd(amount, nonce, wallet, provider, config);

        await addTransactionToQueue(
          selectedFunction,
          `${actionName} ${amount} ${tokenPrompt}`,
          normalizedNetwork
        );    
        await updateWalletData(normalizedNetwork);
        addLog(`${actionName}: ${actionName.includes("Stake") ? "Staking" : "Penambahan LP"} ${amount} ${tokenPrompt} selesai.`, "success", normalizedNetwork);
      } catch (error) {
        addLog(`${actionName}: Gagal - ${error.message}`, "error", normalizedNetwork);
      } finally {
        if (normalizedNetwork === "Sepolia") {
          swapRunningSepolia = false;
          addLog("swapRunningSepolia diatur ke false", "debug", normalizedNetwork);
        } else if (normalizedNetwork === "Sepolia R2") {
          swapRunningSepoliaR2 = false;
          addLog("swapRunningSepoliaR2 diatur ke false", "debug", normalizedNetwork);
        } else if (normalizedNetwork === "Pharos") {
          swapRunningPharos = false;
          addLog("swapRunningPharos diatur ke false", "debug", normalizedNetwork);
        } else if (normalizedNetwork === "Monad") {
          swapRunningMonad = false;
          addLog("swapRunningMonad diatur ke false", "debug", normalizedNetwork);
        } 

        mainMenu.setItems(getMainMenItems());
        activeSubMenu.setItems(normalizedNetwork === "Sepolia" ? getSepoliaSubMenuItems() :
                              normalizedNetwork === "Sepolia R2" ? getSepoliaR2SubMenuItems() :
                              normalizedNetwork === "Pharos" ? getPharosSubMenuItems() :
                              getMonadSubMenuItems());
        safeRender();
      }
      addLog(`${actionName}: Selesai.`, "swap", normalizedNetwork);
    });
  } else {
    promptBox.readInput(`Masukkan jumlah Swap untuk ${actionName}`, "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog(`${actionName}: Input tidak valid atau dibatalkan.`, "swap", normalizedNetwork);
        return;
      }
      const loopCount = parseInt(value);
      if (isNaN(loopCount)) {
        addLog(`${actionName}: Input harus berupa angka.`, "swap", normalizedNetwork);
        return;
      }
      addLog(`${actionName}: Mulai ${loopCount} Swap.`, "swap", normalizedNetwork);

      if (normalizedNetwork === "Sepolia") {
        swapRunningSepolia = true;
        swapCancelledSepolia = false;
        addLog("swapRunningSepolia diatur ke true", "debug", normalizedNetwork);
      } else if (normalizedNetwork === "Sepolia R2") {
        swapRunningSepoliaR2 = true;
        swapCancelledSepoliaR2 = false;
        addLog("swapRunningSepoliaR2 diatur ke true", "debug", normalizedNetwork);
      } else if (normalizedNetwork === "Pharos") {
        swapRunningPharos = true;
        swapCancelledPharos = false;
        addLog("swapRunningPharos diatur ke true", "debug", normalizedNetwork);
      } else if (normalizedNetwork === "Monad") {
        swapRunningMonad = true;
        swapCancelledMonad = false;
        addLog("swapRunningMonad diatur ke true", "debug", normalizedNetwork);
      } 

      mainMenu.setItems(getMainMenItems());
      const activeSubMenu = normalizedNetwork === "Sepolia" ? sepoliaSubMenu :
                            normalizedNetwork === "Sepolia R2" ? r2SepoliaSubMenu :
                            normalizedNetwork === "Pharos" ? pharosSubMenu :
                            monadSubMenu;
      activeSubMenu.setItems(normalizedNetwork === "Sepolia" ? getSepoliaSubMenuItems() :
                            normalizedNetwork === "Sepolia R2" ? getSepoliaR2SubMenuItems() :
                            normalizedNetwork === "Pharos" ? getPharosSubMenuItems() :
                            getMonadSubMenuItems());
      activeSubMenu.show();
      activeSubMenu.focus();
      safeRender();

      try {
        for (let i = 1; i <= loopCount; i++) {
          if ((normalizedNetwork === "Sepolia" && swapCancelledSepolia) ||
              (normalizedNetwork === "Sepolia R2" && swapCancelledSepoliaR2) ||
              (normalizedNetwork === "Pharos" && swapCancelledPharos) ||
              (normalizedNetwork === "Monad" && swapCancelledMonad)) {
            addLog(`${actionName}: Dihentikan pada Swap ${i}.`, "swap", normalizedNetwork);
            break;
          }
          addLog(`Memulai Swap ke-${i}`, "swap", normalizedNetwork);
          const success = await actionFunction(normalizedNetwork);
          if (success) {
            await updateWalletData(normalizedNetwork);
          }
          if (i < loopCount) {
            const delayTime = getRandomDelay();
            const minutes = Math.floor(delayTime / 60000);
            const seconds = Math.floor((delayTime % 60000) / 1000);
            addLog(`Swap ke-${i} selesai. Menunggu ${minutes} menit ${seconds} detik.`, "swap", normalizedNetwork);
            await waitWithCancel(delayTime, "swap", normalizedNetwork);
            if ((normalizedNetwork === "Sepolia" && swapCancelledSepolia) ||
                (normalizedNetwork === "Sepolia R2" && swapCancelledSepoliaR2) ||
                (normalizedNetwork === "Pharos" && swapCancelledPharos) ||
                (normalizedNetwork === "Monad" && swapCancelledMonad)) {
              addLog(`${actionName}: Dihentikan saat periode tunggu.`, "swap", normalizedNetwork);
              break;
            }
          }
        }
      } finally {
        if (normalizedNetwork === "Sepolia") {
          swapRunningSepolia = false;
          addLog("swapRunningSepolia diatur ke false", "debug", normalizedNetwork);
        } else if (normalizedNetwork === "Sepolia R2") {
          swapRunningSepoliaR2 = false;
          addLog("swapRunningSepoliaR2 diatur ke false", "debug", normalizedNetwork);
        } else if (normalizedNetwork === "Pharos") {
          swapRunningPharos = false;
          addLog("swapRunningPharos diatur ke false", "debug", normalizedNetwork);
        } else if (normalizedNetwork === "Monad") {
          swapRunningMonad = false;
          addLog("swapRunningMonad diatur ke false", "debug", normalizedNetwork);
        } 

        mainMenu.setItems(getMainMenItems());
        activeSubMenu.setItems(normalizedNetwork === "Sepolia" ? getSepoliaSubMenuItems() :
                              normalizedNetwork === "Sepolia R2" ? getSepoliaR2SubMenuItems() :
                              normalizedNetwork === "Pharos" ? getPharosSubMenuItems() :
                              getMonadSubMenuItems());
        safeRender();
      }
      addLog(`${actionName}: Selesai.`, "swap", normalizedNetwork);
    });
  }
}

function changeRandomAmount(action) {
  const tokens = Object.keys(randomAmountRanges[action]);
  let index = 0;
  function promptForToken() {
    if (index >= tokens.length) {
      addLog(`Change Random Amount: Random amounts untuk ${action} diperbarui.`, "success", currentNetwork);
      const activeSubMenu = currentNetwork === "Sepolia" ? sepoliaChangeRandomAmountSubMenu :
                           currentNetwork === "Sepolia R2" ? r2SepoliaChangeRandomAmountSubMenu :
                           currentNetwork === "Pharos" ? pharosChangeRandomAmountSubMenu :
                           monadChangeRandomAmountSubMenu;
      activeSubMenu.show();
      activeSubMenu.focus();
      safeRender();
      return;
    }
    const token = tokens[index];
    promptBox.setFront();
    promptBox.input(`Masukkan rentang random amount untuk ${token} pada ${action} (format: min,max, contoh: 50,200)`, "", (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog(`Change Random Amount: Input untuk ${token} pada ${action} dibatalkan.`, "system", currentNetwork);
        const activeSubMenu = currentNetwork === "Sepolia" ? sepoliaChangeRandomAmountSubMenu :
                             currentNetwork === "Sepolia R2" ? r2SepoliaChangeRandomAmountSubMenu :
                             currentNetwork === "Pharos" ? pharosChangeRandomAmountSubMenu :
                             monadChangeRandomAmountSubMenu;
        activeSubMenu.show();
        activeSubMenu.focus();
        safeRender();
        return;
      }
      const [min, max] = value.split(",").map(v => parseFloat(v.trim()));
      if (isNaN(min) || isNaN(max) || min <= 0 || max <= min) {
        addLog(`Change Random Amount: Input tidak valid untuk ${token} pada ${action}. Gunakan format min,max (contoh: 50,200) dengan min > 0 dan max > min.`, "error", currentNetwork);
        const activeSubMenu = currentNetwork === "Sepolia" ? sepoliaChangeRandomAmountSubMenu :
                             currentNetwork === "Sepolia R2" ? r2SepoliaChangeRandomAmountSubMenu :
                             currentNetwork === "Pharos" ? pharosChangeRandomAmountSubMenu :
                             monadChangeRandomAmountSubMenu;
        activeSubMenu.show();
        activeSubMenu.focus();
        safeRender();
        return;
      }
      randomAmountRanges[action][token].min = min;
      randomAmountRanges[action][token].max = max;
      index++;
      promptForToken();
    });
  }
  promptForToken();
}

mainMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Sepolia Network") {
    currentNetwork = "Sepolia";
    welcomeBox.hide();
    walletBox.show();
    updateWalletData("Sepolia");
    sepoliaSubMenu.setItems(getSepoliaSubMenuItems());
    sepoliaSubMenu.show();
    r2SepoliaSubMenu.hide();
    pharosSubMenu.hide();
    monadSubMenu.hide();
    sepoliaSubMenu.focus();
    safeRender();
  } else if (selected === "Sepolia R2 Network") {
    currentNetwork = "Sepolia R2";
    welcomeBox.hide();
    walletBox.show();
    updateWalletData("Sepolia R2");
    r2SepoliaSubMenu.setItems(getSepoliaR2SubMenuItems());
    r2SepoliaSubMenu.show();
    sepoliaSubMenu.hide();
    pharosSubMenu.hide();
    monadSubMenu.hide();
    r2SepoliaSubMenu.focus();
    safeRender();
  } else if (selected === "Pharos Network") {
    currentNetwork = "Pharos";
    welcomeBox.hide();
    walletBox.show();
    updateWalletData("Pharos");
    pharosSubMenu.setItems(getPharosSubMenuItems());
    pharosSubMenu.show();
    sepoliaSubMenu.hide();
    r2SepoliaSubMenu.hide();
    monadSubMenu.hide();
    pharosSubMenu.focus();
    safeRender();
  } else if (selected === "Monad Network") {
    currentNetwork = "Monad";
    welcomeBox.hide();
    walletBox.show();
    updateWalletData("Monad");
    monadSubMenu.setItems(getMonadSubMenuItems());
    monadSubMenu.show();
    sepoliaSubMenu.hide();
    r2SepoliaSubMenu.hide();
    pharosSubMenu.hide();
    monadSubMenu.focus();
    safeRender();
  } else if (selected === "Claim Faucet") {
    mainMenu.hide();
    claimFaucetSubMenu.setItems(getClaimFaucetSubMenuItems());
    claimFaucetSubMenu.show();
    claimFaucetSubMenu.focus();
    safeRender();
  } else if (selected === "Antrian Transaksi") {
    showTransactionQueueMenu();
  } else if (selected === "Stop All Transaction") {
    if (swapRunningSepolia || swapRunningSepoliaR2  || swapRunningPharos || swapRunningMonad) {
      swapCancelledSepolia = true;
      swapCancelledSepoliaR2 = true;
      swapCancelledPharos = true;
      swapCancelledMonad = true;
      addLog("Stop All Transaction: Semua transaksi akan dihentikan.", "system", currentNetwork);
    }
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Refresh") {
    updateWelcomeBox();
    updateWalletData(currentNetwork);
    safeRender();
    addLog("Refreshed", "system", currentNetwork);
  } else if (selected === "Exit") {
    process.exit(0);
  }
});

sepoliaSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Auto Swap R2USD & USDC") {
    if (swapRunningSepolia) {
      addLog("Transaksi sedang berjalan di Sepolia. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoSwapR2usdUsdc, "Auto Swap R2USD & USDC", "Sepolia");
    }
  } else if (selected === "Auto Stake R2USD & sR2USD") {
    if (swapRunningSepolia) {
      addLog("Transaksi sedang berjalan di Sepolia. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoStakeR2usdSr2usd, "Auto Stake R2USD & sR2USD", "Sepolia");
    }
  } else if (selected === "Auto Add LP R2USD & sR2USD") {
    if (swapRunningSepolia) {
      addLog("Transaksi sedang berjalan di Sepolia. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoAddLpR2usdSr2usd, "Auto Add LP R2USD & sR2USD", "Sepolia");
    }
  } else if (selected === "Auto Add LP USDC & R2USD") {
    if (swapRunningSepolia) {
      addLog("Transaksi sedang berjalan di Sepolia. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoAddLpUsdcR2usd, "Auto Add LP USDC & R2USD", "Sepolia");
    }
  } else if (selected === "Manual Swap") {
    sepoliaSubMenu.hide();
    sepoliaManualSwapSubMenu.show();
    sepoliaManualSwapSubMenu.focus();
    safeRender();
  } else if (selected === "Change Random Amount") {
    sepoliaSubMenu.hide();
    sepoliaChangeRandomAmountSubMenu.show();
    sepoliaChangeRandomAmountSubMenu.focus();
    safeRender();
  } else if (selected === "Stop Transaction") {
    if (swapRunningSepolia) {
      swapCancelledSepolia = true;
      addLog("Perintah Stop Transaction diterima untuk Sepolia.", "swap", currentNetwork);
    }
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Back To Main Menu") {
    sepoliaSubMenu.hide();
    walletBox.hide();
    welcomeBox.show();
    mainMenu.show();
    mainMenu.focus();
    updateWelcomeBox();
    safeRender();
  } else if (selected === "Refresh") {
    updateWalletData("Sepolia");
    safeRender();
    addLog("Refreshed", "system", currentNetwork);
  }
});

r2SepoliaSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Auto Swap R2 & USDC") {
    if (swapRunningSepoliaR2) {
      addLog("Transaksi sedang berjalan di Sepolia R2. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoSwapR2Usdc, "Auto Swap R2 & USDC", "Sepolia R2", "swap");
    }
  } else if (selected === "Auto Swap R2 & R2USD") {
    if (swapRunningSepoliaR2) {
      addLog("Transaksi sedang berjalan di Sepolia R2. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoSwapR2R2usd, "Auto Swap R2 & R2USD", "Sepolia R2", "swap");
    }
  } else if (selected === "Auto Add LP R2 & USDC") {
    if (swapRunningSepoliaR2) {
      addLog("Transaksi sedang berjalan di Sepolia R2. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoAddLpR2Usdc, "Auto Add LP R2 & USDC", "Sepolia R2", "single");
    }
  } else if (selected === "Auto Add LP R2 & R2USD") {
    if (swapRunningSepoliaR2) {
      addLog("Transaksi sedang berjalan di Sepolia R2. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoAddLpR2R2usd, "Auto Add LP R2 & R2USD", "Sepolia R2", "single");
    }
  } else if (selected === "Manual Swap") {
    r2SepoliaSubMenu.hide();
    r2SepoliaManualSwapSubMenu.show();
    r2SepoliaManualSwapSubMenu.focus();
    safeRender();
  } else if (selected === "Change Random Amount") {
    r2SepoliaSubMenu.hide();
    r2SepoliaChangeRandomAmountSubMenu.show();
    r2SepoliaChangeRandomAmountSubMenu.focus();
    safeRender();
  } else if (selected === "Stop Transaction") {
    if (swapRunningSepoliaR2) {
      swapCancelledSepoliaR2 = true;
      addLog("Perintah Stop Transaction diterima untuk Sepolia R2.", "swap", currentNetwork);
    }
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Back To Main Menu") {
    r2SepoliaSubMenu.hide();
    walletBox.hide();
    welcomeBox.show();
    mainMenu.show();
    mainMenu.focus();
    updateWelcomeBox();
    safeRender();
  } else if (selected === "Refresh") {
    updateWalletData("Sepolia R2");
    safeRender();
    addLog("Refreshed", "system", currentNetwork);
  }
});

pharosSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Auto Swap R2USD & USDC") {
    if (swapRunningPharos) {
      addLog("Transaksi sedang berjalan di Pharos. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoSwapR2usdUsdc, "Auto Swap R2USD & USDC", "Pharos");
    }
  } else if (selected === "Auto Stake R2USD & sR2USD") {
    if (swapRunningPharos) {
      addLog("Transaksi sedang berjalan di Pharos. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoStakeR2usdSr2usd, "Auto Stake R2USD & sR2USD", "Pharos");
    }
  } else if (selected === "Manual Swap") {
    pharosSubMenu.hide();
    pharosManualSwapSubMenu.show();
    pharosManualSwapSubMenu.focus();
    safeRender();
  } else if (selected === "Change Random Amount") {
    pharosSubMenu.hide();
    pharosChangeRandomAmountSubMenu.show();
    pharosChangeRandomAmountSubMenu.focus();
    safeRender();
  } else if (selected === "Stop Transaction") {
    if (swapRunningPharos) {
      swapCancelledPharos = true;
      addLog("Perintah Stop Transaction diterima untuk Pharos.", "swap", currentNetwork);
    }
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Back To Main Menu") {
    pharosSubMenu.hide();
    sepoliaSubMenu.hide();
    r2SepoliaSubMenu.hide();
    monadSubMenu.hide();
    walletBox.hide();
    welcomeBox.show();
    mainMenu.show();
    mainMenu.focus();
    updateWelcomeBox();
    safeRender();
  } else if (selected === "Refresh") {
    updateWalletData("Pharos");
    safeRender();
    addLog("Refreshed", "system", currentNetwork);
  }
});

monadSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Auto Swap R2USD & USDC") {
    if (swapRunningMonad) {
      addLog("Transaksi sedang berjalan di Monad. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoSwapR2usdUsdc, "Auto Swap R2USD & USDC", "Monad");
    }
  } else if (selected === "Auto Stake R2USD & sR2USD") {
    if (swapRunningMonad) {
      addLog("Transaksi sedang berjalan di Monad. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoStakeR2usdSr2usd, "Auto Stake R2USD & sR2USD", "Monad");
    }
  } else if (selected === "Auto Add LP R2USD & sR2USD") {
    if (swapRunningMonad) {
      addLog("Transaksi sedang berjalan di Monad. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoAddLpR2usdSr2usd, "Auto Add LP R2USD & sR2USD", "Monad", "single");
    }
  } else if (selected === "Auto Add LP USDC & R2USD") {
    if (swapRunningMonad) {
      addLog("Transaksi sedang berjalan di Monad. Hentikan transaksi terlebih dahulu.", "warning", currentNetwork);
    } else {
      runAutoAction(autoAddLpUsdcR2usd, "Auto Add LP USDC & R2USD", "Monad", "single");
    }
  } else if (selected === "Manual Swap") {
    monadSubMenu.hide();
    monadManualSwapSubMenu.show();
    monadManualSwapSubMenu.focus();
    safeRender();
  } else if (selected === "Change Random Amount") {
    monadSubMenu.hide();
    monadChangeRandomAmountSubMenu.show();
    monadChangeRandomAmountSubMenu.focus();
    safeRender();
  } else if (selected === "Stop Transaction") {
    if (swapRunningMonad) {
      swapCancelledMonad = true;
      addLog("Perintah Stop Transaction diterima untuk Monad.", "swap", currentNetwork);
    }
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Back To Main Menu") {
    monadSubMenu.hide();
    sepoliaSubMenu.hide();
    r2SepoliaSubMenu.hide();
    pharosSubMenu.hide();
    monadManualSwapSubMenu.hide();
    monadChangeRandomAmountSubMenu.hide();
    walletBox.hide();
    welcomeBox.show();
    mainMenu.show();
    mainMenu.focus();
    updateWelcomeBox();
    safeRender();
  } else if (selected === "Refresh") {
    updateWalletData("Monad");
    safeRender();
    addLog("Refreshed", "system", currentNetwork);
  }
});


claimFaucetSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Auto Claim Faucet All Network") {
    if (claimRunning) {
      addLog("Proses claim faucet sedang berjalan. Hentikan proses terlebih dahulu.", "warning");
    } else {
      addLog("Memulai Auto Claim Faucet untuk semua jaringan.", "system");
      claimAllFaucetsWithDelay();
    }
  } else if (selected === "Auto Daily Claim Faucet All Network") {
    if (claimRunning) {
      addLog("Proses claim faucet sedang berjalan. Hentikan proses terlebih dahulu.", "warning");
    } else {
      startAutoDailyClaim();
    }
  } else if (selected === "Stop Auto Daily Claim") {
    stopAutoDailyClaim();
  } else if (selected === "Stop Proses") {
    if (claimRunning) {
      claimCancelled = true;
      addLog("Perintah Stop Proses diterima untuk claim faucet.", "system");
      claimFaucetSubMenu.setItems(getClaimFaucetSubMenuItems());
      safeRender();
    }
  } else if (selected.startsWith("Claim Faucet ")) {
    const network = selected.replace("Claim Faucet ", "");
    addLog(`Memulai Claim Faucet untuk ${network}.`, "system");
    claimFaucet(network);
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Back to Main Menu") {
    claimFaucetSubMenu.hide();
    mainMenu.setItems(getMainMenItems());
    mainMenu.show();
    mainMenu.focus();
    safeRender();
  } else if (selected === "Refresh") {
    addLog("Refreshed", "system");
    claimFaucetSubMenu.setItems(getClaimFaucetSubMenuItems());
    safeRender();
  }
});

sepoliaManualSwapSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "USDC -> R2USD") {
    promptBox.setFront();
    promptBox.input("Masukkan jumlah USDC yang ingin di-swap ke R2USD", "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog("Manual Swap: Input tidak valid atau dibatalkan.", "swap", currentNetwork);
        return;
      }
      const amount = parseFloat(value);
      if (isNaN(amount) || amount <= 0) {
        addLog("Manual Swap: Jumlah harus berupa angka lebih besar dari 0.", "swap", currentNetwork);
        return;
      }
      addLog(`Manual Swap: Memulai swap ${amount} USDC ke R2USD.`, "swap", currentNetwork);
      try {
        await addTransactionToQueue(
          (nonce, wallet, provider, config) => swapUsdcToR2usd(amount, nonce, wallet, provider, config),
          `Manual Swap ${amount} USDC to R2USD`,
          "Sepolia"
        );
        await updateWalletData("Sepolia");
        addLog(`Manual Swap: Swap ${amount} USDC ke R2USD selesai.`, "success", currentNetwork);
      } catch (error) {
        addLog(`Manual Swap: Gagal - ${error.message}`, "error", currentNetwork);
      }
    });
  } else if (selected === "R2USD -> USDC") {
    promptBox.setFront();
    promptBox.input("Masukkan jumlah R2USD yang ingin di-swap ke USDC", "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog("Manual Swap: Input tidak valid atau dibatalkan.", "swap", currentNetwork);
        return;
      }
      const amount = parseFloat(value);
      if (isNaN(amount) || amount <= 0) {
        addLog("Manual Swap: Jumlah harus berupa angka lebih besar dari 0.", "swap", currentNetwork);
        return;
      }
      addLog(`Manual Swap: Memulai swap ${amount} R2USD ke USDC.`, "swap", currentNetwork);
      try {
        await addTransactionToQueue(
          (nonce, wallet, provider, config) => swapR2usdToUsdc(amount, nonce, wallet, provider, config),
          `Manual Swap ${amount} R2USD to USDC`,
          "Sepolia"
        );
        await updateWalletData("Sepolia");
        addLog(`Manual Swap: Swap ${amount} R2USD ke USDC selesai.`, "success", currentNetwork);
      } catch (error) {
        addLog(`Manual Swap: Gagal - ${error.message}`, "error", currentNetwork);
      }
    });
  } else if (selected === "Back To Sepolia Network Menu") {
    sepoliaManualSwapSubMenu.hide();
    sepoliaSubMenu.setItems(getSepoliaSubMenuItems());
    sepoliaSubMenu.show();
    sepoliaSubMenu.focus();
    safeRender();
  }
});

r2SepoliaManualSwapSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "R2 -> USDC") {
    promptBox.setFront();
    promptBox.input("Masukkan jumlah R2 yang ingin di-swap ke USDC", "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog("Manual Swap: Input tidak valid atau dibatalkan.", "swap", currentNetwork);
        return;
      }
      const amount = ethers.parseUnits(value, 18); 
      addLog(`Manual Swap: Memulai swap ${value} R2 ke USDC.`, "swap", currentNetwork);
      try {
        await addTransactionToQueue(
          (nonce, wallet, provider, config) => swapTokens(amount, config.R2_ADDRESS, config.USDC_ADDRESS, nonce, wallet, provider, config),
          `Manual Swap ${value} R2 to USDC`,
          "Sepolia R2"
        );
        await updateWalletData("Sepolia R2");
        addLog(`Manual Swap: Swap ${value} R2 ke USDC selesai.`, "success", currentNetwork);
      } catch (error) {
        addLog(`Manual Swap: Gagal - ${error.message}`, "error", currentNetwork);
      }
    });
  } else if (selected === "USDC -> R2") {
    promptBox.setFront();
    promptBox.input("Masukkan jumlah USDC yang ingin di-swap ke R2", "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog("Manual Swap: Input tidak valid atau dibatalkan.", "swap", currentNetwork);
        return;
      }
      const amount = ethers.parseUnits(value, 6);
      addLog(`Manual Swap: Memulai swap ${value} USDC ke R2.`, "swap", currentNetwork);
      try {
        await addTransactionToQueue(
          (nonce, wallet, provider, config) => swapTokens(amount, config.USDC_ADDRESS, config.R2_ADDRESS, nonce, wallet, provider, config),
          `Manual Swap ${value} USDC to R2`,
          "Sepolia R2"
        );
        await updateWalletData("Sepolia R2");
        addLog(`Manual Swap: Swap ${value} USDC ke R2 selesai.`, "success", currentNetwork);
      } catch (error) {
        addLog(`Manual Swap: Gagal - ${error.message}`, "error", currentNetwork);
      }
    });
  } else if (selected === "R2 -> R2USD") {
    promptBox.setFront();
    promptBox.input("Masukkan jumlah R2 yang ingin di-swap ke R2USD", "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog("Manual Swap: Input tidak valid atau dibatalkan.", "swap", currentNetwork);
        return;
      }
      const amount = ethers.parseUnits(value, 18); 
      addLog(`Manual Swap: Memulai swap ${value} R2 ke R2USD.`, "swap", currentNetwork);
      try {
        await addTransactionToQueue(
          (nonce, wallet, provider, config) => swapTokens(amount, config.R2_ADDRESS, config.R2USD_ADDRESS, nonce, wallet, provider, config),
          `Manual Swap ${value} R2 to R2USD`,
          "Sepolia R2"
        );
        await updateWalletData("Sepolia R2");
        addLog(`Manual Swap: Swap ${value} R2 ke R2USD selesai.`, "success", currentNetwork);
      } catch (error) {
        addLog(`Manual Swap: Gagal - ${error.message}`, "error", currentNetwork);
      }
    });
  } else if (selected === "R2USD -> R2") {
    promptBox.setFront();
    promptBox.input("Masukkan jumlah R2USD yang ingin di-swap ke R2", "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog("Manual Swap: Input tidak valid atau dibatalkan.", "swap", currentNetwork);
        return;
      }
      const amount = ethers.parseUnits(value, 6); 
      addLog(`Manual Swap: Memulai swap ${value} R2USD ke R2.`, "swap", currentNetwork);
      try {
        await addTransactionToQueue(
          (nonce, wallet, provider, config) => swapTokens(amount, config.R2USD_ADDRESS, config.R2_ADDRESS, nonce, wallet, provider, config),
          `Manual Swap ${value} R2USD to R2`,
          "Sepolia R2"
        );
        await updateWalletData("Sepolia R2");
        addLog(`Manual Swap: Swap ${value} R2USD ke R2 selesai.`, "success", currentNetwork);
      } catch (error) {
        addLog(`Manual Swap: Gagal - ${error.message}`, "error", currentNetwork);
      }
    });
  } else if (selected === "Back To Sepolia R2 Network Menu") {
    r2SepoliaManualSwapSubMenu.hide();
    r2SepoliaSubMenu.setItems(getSepoliaR2SubMenuItems());
    r2SepoliaSubMenu.show();
    r2SepoliaSubMenu.focus();
    safeRender();
  }
});

pharosManualSwapSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "USDC -> R2USD") {
    promptBox.setFront();
    promptBox.input("Masukkan jumlah USDC yang ingin di-swap ke R2USD", "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog("Manual Swap: Input tidak valid atau dibatalkan.", "swap", currentNetwork);
        return;
      }
      const amount = parseFloat(value);
      if (isNaN(amount) || amount <= 0) {
        addLog("Manual Swap: Jumlah harus berupa angka lebih besar dari 0.", "swap", currentNetwork);
        return;
      }
      addLog(`Manual Swap: Memulai swap ${amount} USDC ke R2USD.`, "swap", currentNetwork);
      try {
        await addTransactionToQueue(
          (nonce, wallet, provider, config) => swapUsdcToR2usd(amount, nonce, wallet, provider, config),
          `Manual Swap ${amount} USDC to R2USD`,
          "Pharos"
        );
        await updateWalletData("Pharos");
        addLog(`Manual Swap: Swap ${amount} USDC ke R2USD selesai.`, "success", currentNetwork);
      } catch (error) {
        addLog(`Manual Swap: Gagal - ${error.message}`, "error", currentNetwork);
      }
    });
  } else if (selected === "R2USD -> USDC") {
    promptBox.setFront();
    promptBox.input("Masukkan jumlah R2USD yang ingin di-swap ke USDC", "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog("Manual Swap: Input tidak valid atau dibatalkan.", "swap", currentNetwork);
        return;
      }
      const amount = parseFloat(value);
      if (isNaN(amount) || amount <= 0) {
        addLog("Manual Swap: Jumlah harus berupa angka lebih besar dari 0.", "swap", currentNetwork);
        return;
      }
      addLog(`Manual Swap: Memulai swap ${amount} R2USD ke USDC.`, "swap", currentNetwork);
      try {
        await addTransactionToQueue(
          (nonce, wallet, provider, config) => swapR2usdToUsdC(amount, nonce, wallet, provider, config),
          `Manual Swap ${amount} R2USD to USDC`,
          "Pharos"
        );
        await updateWalletData("Pharos");
        addLog(`Manual Swap: Swap ${amount} R2USD ke USDC selesai.`, "success", currentNetwork);
      } catch (error) {
        addLog(`Manual Swap: Gagal - ${error.message}`, "error", currentNetwork);
      }
    });
  } else if (selected === "Back To Pharos Network Menu") {
    pharosManualSwapSubMenu.hide();
    pharosSubMenu.setItems(getPharosSubMenuItems());
    pharosSubMenu.show();
    pharosSubMenu.focus();
    safeRender();
  }
});

monadManualSwapSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "USDC -> R2USD") {
    promptBox.setFront();
    promptBox.input("Masukkan jumlah USDC yang ingin di-swap ke R2USD", "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog("Manual Swap: Input tidak valid atau dibatalkan.", "swap", currentNetwork);
        return;
      }
      const amount = parseFloat(value);
      if (isNaN(amount) || amount <= 0) {
        addLog("Manual Swap: Jumlah harus berupa angka lebih besar dari 0.", "swap", currentNetwork);
        return;
      }
      addLog(`Manual Swap: Memulai swap ${amount} USDC ke R2USD.`, "swap", currentNetwork);
      try {
        await addTransactionToQueue(
          (nonce, wallet, provider, config) => swapUsdcToR2usd(amount, nonce, wallet, provider, config),
          `Manual Swap ${amount} USDC to R2USD`,
          "Monad"
        );
        await updateWalletData("Monad");
        addLog(`Manual Swap: Swap ${amount} USDC ke R2USD selesai.`, "success", currentNetwork);
      } catch (error) {
        addLog(`Manual Swap: Gagal - ${error.message}`, "error", currentNetwork);
      }
    });
  } else if (selected === "R2USD -> USDC") {
    promptBox.setFront();
    promptBox.input("Masukkan jumlah R2USD yang ingin di-swap ke USDC", "", async (err, value) => {
      promptBox.hide();
      safeRender();
      if (err || !value) {
        addLog("Manual Swap: Input tidak valid atau dibatalkan.", "swap", currentNetwork);
        return;
      }
      const amount = parseFloat(value);
      if (isNaN(amount) || amount <= 0) {
        addLog("Manual Swap: Jumlah harus berupa angka lebih besar dari 0.", "swap", currentNetwork);
        return;
      }
      addLog(`Manual Swap: Memulai swap ${amount} R2USD ke USDC.`, "swap", currentNetwork);
      try {
        await addTransactionToQueue(
          (nonce, wallet, provider, config) => swapR2usdToUsdC(amount, nonce, wallet, provider, config),
          `Manual Swap ${amount} R2USD to USDC`,
          "Monad"
        );
        await updateWalletData("Monad");
        addLog(`Manual Swap: Swap ${amount} R2USD ke USDC selesai.`, "success", currentNetwork);
      } catch (error) {
        addLog(`Manual Swap: Gagal - ${error.message}`, "error", currentNetwork);
      }
    });
  } else if (selected === "Back To Monad Network Menu") {
    monadManualSwapSubMenu.hide();
    monadSubMenu.setItems(getMonadSubMenuItems());
    monadSubMenu.show();
    monadSubMenu.focus();
    safeRender();
  }
});


sepoliaChangeRandomAmountSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "SWAP_R2USD_USDC") {
    changeRandomAmount("SWAP_R2USD_USDC");
  } else if (selected === "Back To Sepolia Network Menu") {
    sepoliaChangeRandomAmountSubMenu.hide();
    sepoliaSubMenu.setItems(getSepoliaSubMenuItems());
    sepoliaSubMenu.show();
    sepoliaSubMenu.focus();
    safeRender();
  }
});

r2SepoliaChangeRandomAmountSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "SWAP_R2USD_USDC") {
    changeRandomAmount("SWAP_R2USD_USDC");
  } else if (selected === "Back To Sepolia R2 Network Menu") {
    r2SepoliaChangeRandomAmountSubMenu.hide();
    r2SepoliaSubMenu.setItems(getSepoliaR2SubMenuItems());
    r2SepoliaSubMenu.show();
    r2SepoliaSubMenu.focus();
    safeRender();
  }
});


pharosChangeRandomAmountSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "SWAP_R2USD_USDC") {
    changeRandomAmount("SWAP_R2USD_USDC");
  } else if (selected === "Back To Pharos Network Menu") {
    pharosChangeRandomAmountSubMenu.hide();
    pharosSubMenu.setItems(getPharosSubMenuItems());
    pharosSubMenu.show();
    pharosSubMenu.focus();
    safeRender();
  }
});

monadChangeRandomAmountSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "SWAP_R2USD_USDC") {
    changeRandomAmount("SWAP_R2USD_USDC");
  } else if (selected === "Back To Monad Network Menu") {
    monadChangeRandomAmountSubMenu.hide();
    monadSubMenu.setItems(getMonadSubMenuItems());
    monadSubMenu.show();
    monadSubMenu.focus();
    safeRender();
  }
});

screen.key(["escape", "q", "C-c"], () => {
  process.exit(0);
});
screen.key(["C-up"], () => { logsBox.scroll(-1); safeRender(); });
screen.key(["C-down"], () => { logsBox.scroll(1); safeRender(); });

safeRender();
mainMenu.focus();
addLog("Dont Forget To Subscribe YT And Telegram @NTExhaust!!", "system");
updateWelcomeBox();
