let transactions = [];
let editingTransactionId = null; 
let isEditMode = false;

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  try {
    await expensesDB.init();
    await registerServiceWorker();
    await loadTransactions();

    initializeDrawer();
    initializeBottomNav();

    document.getElementById('date').valueAsDate = new Date();

    document.getElementById('btn-add').addEventListener('click', openModal);
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('form-transaction').addEventListener('submit', saveTransaction);

    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') {
        closeModal();
      }
    });

    render();

    console.log('✅ App initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing app:', error);
    alert('Error initializing the application. Please reload the page.');
  }
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js');
      console.log('✅ Service Worker registered:', registration.scope);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 New Service Worker version found');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('✅ New version activated');
            if (confirm('New version available! Reload page?')) {
              window.location.reload();
            }
          }
        });
      });
    } catch (error) {
      console.error('❌ Error registering Service Worker:', error);
    }
  } else {
    console.warn('⚠️ Service Workers not supported in this browser');
  }
}

async function loadTransactions() {
  try {
    transactions = await expensesDB.getAll();
    console.log(`📊 ${transactions.length} transactions loaded`);
  } catch (error) {
    console.error('❌ Error loading transactions:', error);
    transactions = [];
  }
}


function openModal() {
  document.getElementById('modal').classList.add('show');
  
  if (!isEditMode) {
    document.getElementById('form-transaction').reset();
    document.getElementById('date').valueAsDate = new Date();
    document.querySelector('#modal h2').textContent = 'Nova Transação';
    document.querySelector('#form-transaction button[type="submit"]').textContent = 'Salvar';
  }
}
function closeModal() {
  document.getElementById('modal').classList.remove('show');
  
  isEditMode = false;
  editingTransactionId = null;
  
  document.querySelector('#modal h2').textContent = 'Nova Transação';
  document.querySelector('#form-transaction button[type="submit"]').textContent = 'Salvar';
}

async function saveTransaction(event) {
  event.preventDefault();
  
  const type = document.querySelector('input[name="type"]:checked').value;
  const description = document.getElementById('description').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  
  const transaction = {
    type,
    description,
    amount,
    category,
    date,
    timestamp: Date.now()
  };
  
  try {
    if (isEditMode && editingTransactionId) {
      transaction.id = editingTransactionId;
      await expensesDB.update(transaction);
      console.log('✅ Transaction updated:', editingTransactionId);
      
      isEditMode = false;
      editingTransactionId = null;
    } else {
      await expensesDB.add(transaction);
      console.log('✅ Transaction added');
    }
    
    await loadTransactions();
    closeModal();
    render();
    
  } catch (error) {
    console.error('❌ Error saving transaction:', error);
    alert('Error saving transaction. Please try again.');
  }
}

async function deleteTransaction(id) {
  if (confirm('Are you sure you want to delete this transaction?')) {
    try {
      await expensesDB.delete(id);
      await loadTransactions();
      render();
    } catch (error) {
      console.error('❌ Error deleting:', error);
      alert('Error deleting transaction.');
    }
  }
}

async function editTransaction(id) {
  try {
    const transaction = await expensesDB.getById(id);
    
    if (!transaction) {
      console.error('❌ Transaction not found:', id);
      alert('Transaction not found.');
      return;
    }
    
    console.log('✏️ Editing transaction:', id);
    
    isEditMode = true;
    editingTransactionId = id;
    
    document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
    document.getElementById('description').value = transaction.description;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('category').value = transaction.category;
    document.getElementById('date').value = transaction.date;
    
    document.querySelector('#modal h2').textContent = 'Edit Transaction';
    
    document.querySelector('#form-transaction button[type="submit"]').textContent = 'Update';
    
    openModal();
    
  } catch (error) {
    console.error('❌ Error loading transaction for edit:', error);
    alert('Error loading transaction. Please try again.');
  }
}

function render() {
  renderSummary();
  renderList();
}

function renderSummary() {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  document.getElementById('total-income').textContent = formatCurrency(income);
  document.getElementById('total-expenses').textContent = formatCurrency(expenses);
  document.getElementById('total-balance').textContent = formatCurrency(balance);
}

function renderList() {
  const list = document.getElementById('transaction-list');

  if (transactions.length === 0) {
    list.innerHTML = '<div class="empty-message">No transactions registered</div>';
    return;
  }


  const sortedTransactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

  list.innerHTML = sortedTransactions.map(t => `
    <div class="transaction-item ${t.type}">
      <div class="item-info">
        <div class="description">${t.description}</div>
        <div class="details">${t.category} • ${formatDate(t.date)}</div>
      </div>
      <div class="item-amount ${t.type}">
        ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
      </div>
      <div class="item-actions">
        <div class="item-actions">
        <button onclick="editTransaction(${t.id})" title="Edit">✏️</button>
  <button onclick="deleteTransaction(${t.id})" title="Delete">🗑️</button>
</div>
      </div>
    </div>
  `).join('');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(date) {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
}

function initializeDrawer() {
  const menuToggle = document.getElementById('menu-toggle');
  const drawer = document.getElementById('drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerClose = document.getElementById('drawer-close');
  const drawerItems = document.querySelectorAll('.drawer-item');

  function openDrawer() {
    drawer.classList.add('active');
    drawerOverlay.classList.add('active');
    menuToggle.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
    menuToggle.classList.remove('active');
    document.body.style.overflow = '';
  }

  menuToggle.addEventListener('click', () => {
    if (drawer.classList.contains('active')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  drawerClose.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  drawerItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      drawerItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const page = item.dataset.page;
      console.log('Navigating to:', page);
      closeDrawer();
    });
  });
}

function initializeBottomNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const navAdd = document.getElementById('nav-add');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;

      if (page === 'add') {
        openModal();
        return;
      }

      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      navigateToPage(page);
    });
  });
}

function navigateToPage(page) {
  console.log('🔄 Navigating to page:', page);

  switch (page) {
    case 'home':
      console.log('📈 Showing Dashboard');
      break;
    case 'history':
      console.log('📋 Showing History');
      break;
    case 'reports':
      console.log('📊 Showing Reports');
      break;
  }
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const btnInstall = document.getElementById('btn-install');
  btnInstall.classList.remove('hidden');

  btnInstall.addEventListener('click', async () => {
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'rejected'} the installation`);

    deferredPrompt = null;
    btnInstall.classList.add('hidden');
  });
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed successfully!');
  deferredPrompt = null;
});
