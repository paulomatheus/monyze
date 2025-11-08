let transactions = [];

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  try {
    await expensesDB.init();
    await loadTransactions();
    
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
  document.getElementById('form-transaction').reset();
  document.getElementById('date').valueAsDate = new Date();
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
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
    await expensesDB.add(transaction);
    await loadTransactions();
    closeModal();
    render();
  } catch (error) {
    console.error('❌ Error saving:', error);
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
    list.innerHTML = '<div class="empty-message">Nenhuma transação cadastrada</div>';
    return;
  }
  

  const sortedTransactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
  
  list.innerHTML = sortedTransactions.map(t => `
    <div class="transaction-item ${t.type}">
      <div class="item-info">
        <div class="descricao">${t.description}</div>
        <div class="detalhes">${t.category} • ${formatDate(t.date)}</div>
      </div>
      <div class="item-amount ${t.type}">
        ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
      </div>
      <div class="item-actions">
        <button onclick="deleteTransaction(${t.id})" title="Excluir">🗑️</button>
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