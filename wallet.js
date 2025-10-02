<script>
let currentAddress = null;
let xp = 0;

async function connectWallet() {
  if (!window.ethereum) {
    alert("Bir web3 cüzdanı (MetaMask / Coinbase Wallet) gerekli.");
    return;
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  currentAddress = accounts[0];
  document.getElementById("addr").textContent =
    currentAddress.slice(0, 6) + "..." + currentAddress.slice(-4);
  loadXP();
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

window.__miniapp = { connectWallet, addXP, loadXP };
</script>
