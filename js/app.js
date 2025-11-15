let transactions = [];
let editingTransactionId = null; 
let isEditMode = false;
let expensesChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  try {
    await expensesDB.init();
    await registerServiceWorker();
    await loadTransactions();

    applyStoredTheme();
    initializeDrawer();
    initializeBottomNav();
    initializeChart();
    initializeViewAllButton();
    initializeReportsPage();

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

function applyStoredTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
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
  updateChart();
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
    
    const page = item.dataset.page;
    
    showPage(page);
    
    closeDrawer();
  });
});
}

function initializeBottomNav() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      
      if (page === 'add') {
        openModal();
        return;
      }
      
      showPage(page);
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
  showPage(page);
}

function initializeChart() {
  const ctx = document.getElementById('expenses-chart');
  
  if (!ctx) {
    console.error('❌ Chart canvas not found');
    return;
  }
  
  expensesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Expenses by Category (R$)',
        data: [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)',
          'rgba(83, 102, 255, 0.7)',
          'rgba(255, 99, 255, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(255, 99, 255, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              return 'R$ ' + context.parsed.y.toFixed(2);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(0);
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
  
  console.log('✅ Chart initialized');
}

function updateChart() {
  if (!expensesChart) {
    console.warn('⚠️ Chart not initialized yet');
    return;
  }
  
  const expenses = transactions.filter(t => t.type === 'expense');
  
  if (expenses.length === 0) {
    document.getElementById('expenses-chart').style.display = 'none';
    document.getElementById('chart-empty-message').classList.remove('hidden');
    return;
  }
  
  document.getElementById('expenses-chart').style.display = 'block';
  document.getElementById('chart-empty-message').classList.add('hidden');
  
  const categoryTotals = {};
  
  expenses.forEach(expense => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += expense.amount;
  });
  
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);
  
  const labels = sortedCategories.map(item => item[0]);
  const data = sortedCategories.map(item => item[1]);
  
  expensesChart.data.labels = labels;
  expensesChart.data.datasets[0].data = data;
  expensesChart.update('active');
  
  console.log('📊 Chart updated with', expenses.length, 'expenses');
}

let currentPage = 'home';

function showPage(pageName) {
  console.log('📄 Showing page:', pageName);
  
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.add('active');
    currentPage = pageName;
    
    updateBottomNav(pageName);
    
    updateDrawerMenu(pageName);
    
    onPageLoad(pageName);
  } else {
    console.error('❌ Page not found:', pageName);
  }
}

function updateBottomNav(pageName) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const itemPage = item.dataset.page;
    if (itemPage === pageName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function updateDrawerMenu(pageName) {
  const drawerItems = document.querySelectorAll('.drawer-item');
  drawerItems.forEach(item => {
    const itemPage = item.dataset.page;
    
    if (itemPage === pageName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function onPageLoad(pageName) {
  switch(pageName) {
    case 'home':
      render();
      break;
      
    case 'history':
      resetHistoryFilters();
      renderFullHistory();
      break;
      
    case 'reports':
      if (!pieChart || !lineChart) {
        initializeReportsPage();
      }
      updateReports();
      break;
      
    case 'settings':
      initializeSettings();
      break;
  }
}

function renderFullHistory() {
  const list = document.getElementById('transaction-list-full');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  if (!list) {
    console.error('❌ transaction-list-full not found');
    return;
  }
  
  let currentFilter = 'all';
  let searchTerm = '';
  
  function applyFiltersAndRender() {
    let filtered = [...transactions];
    
    if (currentFilter !== 'all') {
      filtered = filtered.filter(t => t.type === currentFilter);
    }
    
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search)
      );
    }
    
    renderFilteredTransactions(filtered);
  }
  
  function renderFilteredTransactions(filtered) {
    if (filtered.length === 0) {
      const message = searchTerm.trim() !== '' 
        ? 'Nenhuma transação encontrada para sua busca' 
        : 'Nenhuma transação cadastrada';
      
      list.innerHTML = `
        <div class="no-results">
          <h3>🔍</h3>
          <p>${message}</p>
        </div>
      `;
      
      updateFilterSummary(0);
      return;
    }
    
    const grouped = groupTransactionsByDate(filtered);
    
    list.innerHTML = Object.entries(grouped).map(([dateLabel, items]) => `
      <div class="date-group">
        <div class="date-group-header">${dateLabel} (${items.length})</div>
        <div class="date-group-items">
          ${items.map(t => `
            <div class="transaction-item ${t.type}">
              <div class="item-info">
                <div class="description">${highlightSearchTerm(t.description, searchTerm)}</div>
                <div class="details">${highlightSearchTerm(t.category, searchTerm)} • ${formatDate(t.date)}</div>
              </div>
              <div class="item-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
              </div>
              <div class="item-actions">
                <button onclick="editTransaction(${t.id})" title="Editar">✏️</button>
                <button onclick="deleteTransaction(${t.id})" title="Deletar">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    
    updateFilterSummary(filtered.length);
  }
  
  function updateFilterSummary(count) {
    let summaryEl = document.querySelector('.filter-summary');
    
    if (!summaryEl) {
      summaryEl = document.createElement('div');
      summaryEl.className = 'filter-summary';
      list.parentElement.insertBefore(summaryEl, list);
    }
    
    const filterText = currentFilter === 'all' ? 'todas' : 
                       currentFilter === 'income' ? 'receitas' : 'despesas';
    
    summaryEl.textContent = `Mostrando ${count} ${filterText} ${count !== 1 ? 'transações' : 'transação'}`;
  }
  
  if (searchInput) {
    searchInput.value = '';
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      applyFiltersAndRender();
    });
  }
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      applyFiltersAndRender();
    });
  });
  
  applyFiltersAndRender();
  
  console.log('📋 Full history rendered with filters');
}

function resetHistoryFilters() {
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  if (searchInput) {
    searchInput.value = '';
  }
  
  filterBtns.forEach(btn => {
    if (btn.dataset.filter === 'all') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function groupTransactionsByDate(transactions) {
  const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
  const grouped = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  sorted.forEach(t => {
    const transactionDate = new Date(t.date + 'T00:00:00');
    const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
    
    let label;
    
    if (transactionDay.getTime() === today.getTime()) {
      label = '📅 Hoje';
    } else if (transactionDay.getTime() === yesterday.getTime()) {
      label = '📅 Ontem';
    } else if (transactionDate >= oneWeekAgo) {
      label = '📅 Esta Semana';
    } else if (transactionDate >= oneMonthAgo) {
      label = '📅 Este Mês';
    } else {
      const monthYear = transactionDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      label = `📅 ${monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}`;
    }
    
    if (!grouped[label]) {
      grouped[label] = [];
    }
    
    grouped[label].push(t);
  });
  
  return grouped;
}

function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark style="background-color: #FFEB3B; padding: 2px 4px; border-radius: 3px;">$1</mark>');
}

function initializeSettings() {
  const btnExportAll = document.getElementById('btn-export-all-csv');
  const btnClear = document.getElementById('btn-clear-data');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  updateSettingsStats();
  
  if (btnExportAll) {
    btnExportAll.replaceWith(btnExportAll.cloneNode(true));
    const newBtnExportAll = document.getElementById('btn-export-all-csv');
    
    newBtnExportAll.addEventListener('click', exportAllTransactionsToCSV);
  }
  
  if (btnClear) {
    btnClear.replaceWith(btnClear.cloneNode(true));
    const newBtnClear = document.getElementById('btn-clear-data');
    
    newBtnClear.addEventListener('click', async () => {
      if (confirm('⚠️ ATENÇÃO! Isso vai deletar TODAS as transações. Tem certeza?')) {
        if (confirm('Última chance! Realmente deseja apagar tudo?')) {
          try {
            await expensesDB.clearAll();
            await loadTransactions();
            render();
            updateSettingsStats();
            alert('✅ Todos os dados foram apagados!');
            showPage('home');
          } catch (error) {
            console.error('❌ Error clearing data:', error);
            alert('Erro ao limpar dados. Tente novamente.');
          }
        }
      }
    });
  }
  
  if (darkModeToggle) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      darkModeToggle.checked = true;
    }
    
    darkModeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        console.log('🌙 Dark mode enabled');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        console.log('☀️ Light mode enabled');
      }
    });
  }
  
  console.log('⚙️ Settings initialized');
}

function updateSettingsStats() {
  const totalTransactions = transactions.length;
  const totalIncome = transactions.filter(t => t.type === 'income').length;
  const totalExpenses = transactions.filter(t => t.type === 'expense').length;
  
  document.getElementById('total-transactions-stat').textContent = totalTransactions;
  document.getElementById('total-income-stat').textContent = totalIncome;
  document.getElementById('total-expenses-stat').textContent = totalExpenses;
  
  if (transactions.length > 0) {
    const sortedByDate = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const oldestDate = new Date(sortedByDate[0].date);
    const formatted = oldestDate.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    document.getElementById('oldest-transaction-stat').textContent = formatted;
  } else {
    document.getElementById('oldest-transaction-stat').textContent = '-';
  }
}

function exportAllTransactionsToCSV() {
  if (transactions.length === 0) {
    alert('Nenhuma transação para exportar!');
    return;
  }
  
  let csv = 'Tipo,Descrição,Valor,Categoria,Data\n';
  
  transactions.forEach(t => {
    const type = t.type === 'income' ? 'Receita' : 'Despesa';
    const description = t.description.replace(/,/g, ';');
    const amount = t.amount.toFixed(2).replace('.', ',');
    const category = t.category;
    const date = new Date(t.date).toLocaleDateString('pt-BR');
    
    csv += `${type},${description},${amount},${category},${date}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `monyze-todas-transacoes-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('📥 All transactions exported:', transactions.length);
  alert(`✅ ${transactions.length} transações exportadas com sucesso!`);
}

function initializeViewAllButton() {
  const btnViewAll = document.getElementById('btn-view-all');
  
  if (btnViewAll) {
    btnViewAll.addEventListener('click', () => {
      showPage('history');
    });
  }
}

let pieChart = null;
let lineChart = null;
let currentPeriod = 'current-month';
let filteredTransactions = [];

function initializeReportsPage() {
  initializePieChart();
  initializeLineChart();
  
  const periodBtns = document.querySelectorAll('.period-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');      
      currentPeriod = btn.dataset.period;
      updateReports();
    });
  });
  
  const btnExportCsv = document.getElementById('btn-export-report-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', exportToCSV);
  }
  
  console.log('📊 Reports page initialized');
}

function filterTransactionsByPeriod(period) {
  const now = new Date();
  let startDate;
  
  switch(period) {
    case 'current-month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
      
    case 'last-3-months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
      
    case 'current-year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
      
    case 'all':
      return transactions;
      
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate;
  });
}

function getPeriodLabel(period) {
  const now = new Date();
  
  switch(period) {
    case 'current-month':
      return now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
    case 'last-3-months':
      return 'Últimos 3 meses';
      
    case 'current-year':
      return `Ano de ${now.getFullYear()}`;
      
    case 'all':
      return 'Todo o período';
      
    default:
      return '-';
  }
}

function updateReports() {
  console.log('🔄 Updating reports for period:', currentPeriod);
  filteredTransactions = filterTransactionsByPeriod(currentPeriod);
  updateReportStats();
  updatePieChart();
  updateLineChart();
  updateTopCategories();
}

function updateReportStats() {
  const income = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = income - expenses;
  
  const incomeCount = filteredTransactions.filter(t => t.type === 'income').length;
  const expenseCount = filteredTransactions.filter(t => t.type === 'expense').length;
  
  document.getElementById('report-total-income').textContent = formatCurrency(income);
  document.getElementById('report-total-expenses').textContent = formatCurrency(expenses);
  document.getElementById('report-balance').textContent = formatCurrency(balance);
  
  document.getElementById('report-income-count').textContent = 
    `${incomeCount} transação${incomeCount !== 1 ? 'ões' : ''}`;
  document.getElementById('report-expense-count').textContent = 
    `${expenseCount} transação${expenseCount !== 1 ? 'ões' : ''}`;
  document.getElementById('report-period-label').textContent = getPeriodLabel(currentPeriod);
}

function initializePieChart() {
  const ctx = document.getElementById('pie-chart');
  
  if (!ctx) {
    console.error('❌ Pie chart canvas not found');
    return;
  }
  
  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF',
          '#4BC0C0',
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
  
  console.log('✅ Pie chart initialized');
}

function updatePieChart() {
  if (!pieChart) {
    console.warn('⚠️ Pie chart not initialized');
    return;
  }
  
  const expenses = filteredTransactions.filter(t => t.type === 'expense');
  
  if (expenses.length === 0) {
    document.getElementById('pie-chart').style.display = 'none';
    document.getElementById('pie-empty-message').classList.remove('hidden');
    return;
  }
  
  document.getElementById('pie-chart').style.display = 'block';
  document.getElementById('pie-empty-message').classList.add('hidden');
  
  const categoryTotals = {};
  expenses.forEach(expense => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += expense.amount;
  });
  
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);
  
  const labels = sortedCategories.map(item => item[0]);
  const data = sortedCategories.map(item => item[1]);
  
  pieChart.data.labels = labels;
  pieChart.data.datasets[0].data = data;
  pieChart.update('active');
  
  console.log('🥧 Pie chart updated');
}

function initializeLineChart() {
  const ctx = document.getElementById('line-chart');
  
  if (!ctx) {
    console.error('❌ Line chart canvas not found');
    return;
  }
  
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Receitas',
          data: [],
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Despesas',
          data: [],
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
  
  console.log('✅ Line chart initialized');
}

function updateLineChart() {
  if (!lineChart) {
    console.warn('⚠️ Line chart not initialized');
    return;
  }
  
  if (filteredTransactions.length === 0) {
    document.getElementById('line-chart').style.display = 'none';
    document.getElementById('line-empty-message').classList.remove('hidden');
    return;
  }
  
  document.getElementById('line-chart').style.display = 'block';
  document.getElementById('line-empty-message').classList.add('hidden');
  
  const monthlyData = {};
  
  filteredTransactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    if (t.type === 'income') {
      monthlyData[monthKey].income += t.amount;
    } else {
      monthlyData[monthKey].expenses += t.amount;
    }
  });
  
  const sortedMonths = Object.keys(monthlyData).sort();
  
  const labels = sortedMonths.map(monthKey => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  });
  
  const incomeData = sortedMonths.map(m => monthlyData[m].income);
  const expensesData = sortedMonths.map(m => monthlyData[m].expenses);
  
  lineChart.data.labels = labels;
  lineChart.data.datasets[0].data = incomeData;
  lineChart.data.datasets[1].data = expensesData;
  lineChart.update('active');
  
  console.log('📈 Line chart updated');
}

function updateTopCategories() {
  const list = document.getElementById('top-categories-list');
  
  if (!list) return;
  
  const expenses = filteredTransactions.filter(t => t.type === 'expense');
  
  if (expenses.length === 0) {
    list.innerHTML = '<div class="empty-message">Sem dados disponíveis</div>';
    return;
  }
  
  const categoryTotals = {};
  expenses.forEach(expense => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += expense.amount;
  });
  
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const maxValue = sortedCategories[0][1];
  
  list.innerHTML = sortedCategories.map(([category, amount], index) => {
    const percentage = (amount / maxValue) * 100;
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
    
    return `
      <div class="category-item">
        <div class="category-rank">${medal}</div>
        <div class="category-info">
          <div class="category-name">${category}</div>
          <div class="category-bar">
            <div class="category-bar-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
        <div class="category-amount">${formatCurrency(amount)}</div>
      </div>
    `;
  }).join('');
  
  console.log('🏆 Top categories updated');
}

function exportToCSV() {
  if (filteredTransactions.length === 0) {
    alert('Nenhuma transação para exportar!');
    return;
  }
  
  let csv = 'Tipo,Descrição,Valor,Categoria,Data\n';
  
  filteredTransactions.forEach(t => {
    const type = t.type === 'income' ? 'Receita' : 'Despesa';
    const description = t.description.replace(/,/g, ';');
    const amount = t.amount.toFixed(2).replace('.', ',');
    const category = t.category;
    const date = new Date(t.date).toLocaleDateString('pt-BR');
    
    csv += `${type},${description},${amount},${category},${date}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `monyze-relatorio-${currentPeriod}-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('📥 CSV exported:', filteredTransactions.length, 'transactions');
  alert('✅ Relatório exportado com sucesso!');
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
