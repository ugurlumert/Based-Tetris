// wallet.js (Dış JS: script etiketi YOK)
let currentAddress = null;
let xp = 0;

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Web3 cüzdan (MetaMask / Coinbase Wallet) gerekli.");
      return;
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    currentAddress = accounts[0];
    const addrEl = document.getElementById("addr");
    if (addrEl) addrEl.textContent = currentAddress.slice(0, 6) + "..." + currentAddress.slice(-4);
    loadXP();
  } catch (e) {
    console.error("connectWallet error:", e);
    alert("Cüzdan bağlanamadı: " + (e?.message || e));
  }
}

function loadXP() {
  if (!currentAddress) return;
  const saved = localStorage.getItem("xp_" + currentAddress.toLowerCase());
  xp = saved ? parseInt(saved, 10) : 0;
  updateXPUI();
}

function addXP(amount) {
  xp += amount;
  if (currentAddress) {
    localStorage.setItem("xp_" + currentAddress.toLowerCase(), String(xp));
  }
  updateXPUI();
}

function updateXPUI() {
  const el = document.getElementById("xp");
  if (el) el.textContent = xp;
}

// Global köprü
window.__miniapp = { connectWallet, addXP, loadXP };
