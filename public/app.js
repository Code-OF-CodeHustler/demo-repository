// Main Application Class
class ExpenseTracker {
    constructor() {
        this.currentUser = null;
        this.defaultSettings = {
            enableNotifications: true,
            expenseThreshold: 500,
            budgetThreshold: 90,
            enableAppLock: false
        };
        this.donutChart = null;
        this.barChart = null;
        this.pieChart = null;
        this.currentTimeRange = 'monthly'; // Default time range
        this.currentTab = 'dashboard'; // Default tab
        this.authErrors = {
            invalidEmail: "Please enter a valid email address",
            shortPassword: "Password must be at least 6 characters",
            invalidCredentials: "Invalid email or password",
            userExists: "User already exists",
            passwordsDontMatch: "Passwords don't match"
        };
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
        this.initializeSampleData();
    }

    checkAuthStatus() {
        this.currentUser = JSON.parse(localStorage.getItem('expenseTrackerCurrentUser'));
        
        if (this.currentUser) {
            this.showDashboard();
        } else {
            document.getElementById('welcomePage').classList.remove('hidden');
            document.getElementById('authPage').classList.add('hidden');
            document.getElementById('dashboardPage').classList.add('hidden');
        }
    }

    setupEventListeners() {
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('cancelSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsForm').addEventListener('submit', (e) => this.handleSettingsSubmit(e));
        
        // Welcome page events
        document.getElementById('getStartedBtn').addEventListener('click', () => {
            document.getElementById('welcomePage').classList.add('hidden');
            document.getElementById('authPage').classList.remove('hidden');
        });
        
        document.getElementById('demoLoginWelcomeBtn').addEventListener('click', (e) => this.handleDemoLogin(e));
        
        // Auth page events
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('demoLoginBtn').addEventListener('click', (e) => this.handleDemoLogin(e));
        
        // Dashboard events
        document.getElementById('logoutBtn').addEventListener('click', (e) => this.handleLogout(e));
        document.getElementById('userAvatar').addEventListener('click', (e) => this.toggleUserMenu(e));
        document.getElementById('addTransactionBtn').addEventListener('click', () => this.openModal('add'));
        document.getElementById('floatingAddBtn').addEventListener('click', () => this.openModal('add'));
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        
        // Time dropdown events
        document.querySelectorAll('.time-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentTimeRange = e.target.dataset.time;
                this.updateTimeDisplay();
                this.loadUserData();
            });
        });
        
        // Tab navigation events
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // Category modal events
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.openCategoryModal('add'));
        document.getElementById('closeCategoryModalBtn').addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('cancelCategoryBtn').addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('categoryForm').addEventListener('submit', (e) => this.handleCategorySubmit(e));
        
        // Report type change event
        document.getElementById('reportType').addEventListener('change', () => {
            this.loadUserData();
        });
        
        // Close dropdown when clicking outside
        window.addEventListener('click', (e) => {
            if (!e.target.matches('#userAvatar')) {
                const dropdown = document.getElementById('dropdownMenu');
                if (dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            }
            
            // Close modals when clicking outside
            const transactionModal = document.getElementById('transactionModal');
            if (e.target === transactionModal) {
                this.closeModal();
            }
            
            const categoryModal = document.getElementById('categoryModal');
            if (e.target === categoryModal) {
                this.closeCategoryModal();
            }
        });
    }

    initializeSampleData() {
        // Initialize sample users if not exists
        if (!localStorage.getItem('expenseTrackerUsers')) {
            const sampleUsers = [
                {
                    id: '1',
                    name: 'Demo User',
                    email: 'demo@example.com',
                    password: 'demo123'
                }
            ];
            localStorage.setItem('expenseTrackerUsers', JSON.stringify(sampleUsers));
        }
        
        // Initialize sample transactions if not exists
        if (!localStorage.getItem('expenseTrackerTransactions')) {
            const sampleTransactions = [
                {
                    id: '1',
                    userId: '1',
                    type: 'expense',
                    amount: 125.75,
                    description: 'Grocery Shopping',
                    category: 'food',
                    date: new Date().toISOString().split('T')[0],
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    userId: '1',
                    type: 'income',
                    amount: 850.00,
                    description: 'Freelance Payment',
                    category: 'freelance',
                    date: new Date().toISOString().split('T')[0],
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    userId: '1',
                    type: 'expense',
                    amount: 75.30,
                    description: 'Electric Bill',
                    category: 'utilities',
                    date: new Date().toISOString().split('T')[0],
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('expenseTrackerTransactions', JSON.stringify(sampleTransactions));
        }
        
        // Initialize sample categories if not exists
        if (!localStorage.getItem('expenseTrackerCategories')) {
            const sampleCategories = [
                { id: '1', userId: '1', name: 'Food', type: 'expense', budgetLimit: 300 },
                { id: '2', userId: '1', name: 'Transportation', type: 'expense', budgetLimit: 150 },
                { id: '3', userId: '1', name: 'Housing', type: 'expense', budgetLimit: 1000 },
                { id: '4', userId: '1', name: 'Utilities', type: 'expense', budgetLimit: 200 },
                { id: '5', userId: '1', name: 'Entertainment', type: 'expense', budgetLimit: 100 },
                { id: '6', userId: '1', name: 'Salary', type: 'income' },
                { id: '7', userId: '1', name: 'Freelance', type: 'income' }
            ];
            localStorage.setItem('expenseTrackerCategories', JSON.stringify(sampleCategories));
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('errorMessage');
        
        // Basic validation
        if (!this.validateEmail(email)) {
            this.showError(errorElement, this.authErrors.invalidEmail);
            return;
        }
        
        if (password.length < 6) {
            this.showError(errorElement, this.authErrors.shortPassword);
            return;
        }
        
        try {
            const users = JSON.parse(localStorage.getItem('expenseTrackerUsers')) || [];
            const user = users.find(u => u.email === email.trim().toLowerCase());
            if (!user) {
                this.showError(errorElement, this.authErrors.invalidCredentials);
                return;
            }
            
            // In a real app, you would verify hashed password here
            if (user.password !== password) {
                this.showError(errorElement, this.authErrors.invalidCredentials);
                return;
            }
            
            this.currentUser = user;
            localStorage.setItem('expenseTrackerCurrentUser', JSON.stringify(user));
            this.showDashboard();
            this.showNotification('Login successful!', 'success');
            
        } catch (error) {
            this.showError(errorElement, "An error occurred during login");
            console.error("Login error:", error);
        }
    }

    async handleDemoLogin(e) {
        e.preventDefault();
        
        // Create demo user if not exists
        const demoUser = {
            id: 'demo_' + Date.now(),
            name: 'Demo User',
            email: 'demo@example.com',
            password: 'demo123' // In real app, this would be hashed
        };
        
        let users = JSON.parse(localStorage.getItem('expenseTrackerUsers')) || [];
        const userExists = users.some(u => u.email === demoUser.email);
        
        if (!userExists) {
            users.push(demoUser);
            localStorage.setItem('expenseTrackerUsers', JSON.stringify(users));
        }
        
        this.currentUser = demoUser;
        localStorage.setItem('expenseTrackerCurrentUser', JSON.stringify(demoUser));
        this.showDashboard();
        this.showNotification('Logged in with demo account', 'success');
    }

    handleLogout(e) {
        e.preventDefault();
        this.currentUser = null;
        localStorage.removeItem('expenseTrackerCurrentUser');

        document.getElementById('welcomePage').classList.remove('hidden');
        document.getElementById('authPage').classList.add('hidden');
        document.getElementById('dashboardPage').classList.add('hidden');

        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('errorMessage').style.display = 'none';

        this.showNotification('Logged out successfully', 'success');
    }

    toggleUserMenu(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('dropdownMenu');
        dropdown.classList.toggle('show');
    }

    showDashboard() {
        document.getElementById('welcomePage').classList.add('hidden');
        document.getElementById('authPage').classList.add('hidden');
        document.getElementById('dashboardPage').classList.remove('hidden');
        
        // Set user greeting and avatar
        document.getElementById('userGreeting').textContent = this.currentUser.name.split(' ')[0];
        const initials = this.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('userAvatar').textContent = initials;
        
        // Load user data
        this.loadUserData();
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        const settings = this.getUserSettings();
        
        document.getElementById('enableNotifications').checked = settings.enableNotifications;
        document.getElementById('expenseThreshold').value = settings.expenseThreshold;
        document.getElementById('budgetThreshold').value = settings.budgetThreshold;
        document.getElementById('enableAppLock').checked = settings.enableAppLock;
        
        modal.classList.add('show');
    }
    
    closeSettings() {
        document.getElementById('settingsModal').classList.remove('show');
    }
    
    getUserSettings() {
        return JSON.parse(localStorage.getItem(`expenseTrackerSettings_${this.currentUser.id}`)) || 
               this.defaultSettings;
    }
    
    handleSettingsSubmit(e) {
        e.preventDefault();
        
        const settings = {
            enableNotifications: document.getElementById('enableNotifications').checked,
            expenseThreshold: parseFloat(document.getElementById('expenseThreshold').value),
            budgetThreshold: parseInt(document.getElementById('budgetThreshold').value),
            enableAppLock: document.getElementById('enableAppLock').checked
        };
        
        localStorage.setItem(
            `expenseTrackerSettings_${this.currentUser.id}`,
            JSON.stringify(settings)
        );
        
        this.closeSettings();
        this.showNotification('Settings saved successfully', 'success');
    }

    loadUserData() {
        const transactions = JSON.parse(localStorage.getItem('expenseTrackerTransactions')) || [];
        const categories = JSON.parse(localStorage.getItem('expenseTrackerCategories')) || [];
        const userTransactions = transactions.filter(t => t.userId === this.currentUser.id);
        const userCategories = categories.filter(c => c.userId === this.currentUser.id);
        
        // Update the transactions table
        this.updateTransactionsTable(userTransactions);
        
        // Update the summary cards
        this.updateSummaryCards(userTransactions);
        
        // Create charts
        this.createDonutChart(userTransactions);
        
        // If on reports tab, create reports charts
        if (this.currentTab === 'reports') {
            this.createBarChart(userTransactions);
            this.createPieChart(userTransactions);
        }
        
        // If on categories tab, update categories table
        if (this.currentTab === 'categories') {
            this.updateCategoriesTable(userCategories);
        }
    }

    updateTransactionsTable(transactions) {
        const tbody = document.getElementById('transactionsTableBody');
        tbody.innerHTML = '';
        
        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-muted text-center">
                        No transactions found. Add your first transaction!
                    </td>
                </tr>
            `;
            return;
        }

        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                    $${transaction.amount.toFixed(2)}
                </td>
                <td>
                    <span class="badge ${transaction.type === 'income' ? 'badge-success' : 'badge-danger'}">
                        ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="expenseTracker.editTransaction('${transaction.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="expenseTracker.deleteTransaction('${transaction.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateSummaryCards(transactions) {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const currentBalance = totalIncome - totalExpenses;
        
        document.querySelector('.stat-card.income .value').textContent = `$${totalIncome.toFixed(2)}`;
        document.querySelector('.stat-card.expense .value').textContent = `$${totalExpenses.toFixed(2)}`;
        document.querySelector('.stat-card.balance .value').textContent = `$${currentBalance.toFixed(2)}`;
    }

    createDonutChart(transactions) {
        const ctx = document.getElementById('donutChart').getContext('2d');
        const categories = [...new Set(transactions.map(t => t.category))];
        const data = categories.map(category => {
            return transactions
                .filter(t => t.category === category)
                .reduce((sum, t) => sum + t.amount, 0);
        });
        
        if (this.donutChart) {
            this.donutChart.destroy();
        }
        
        this.donutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#8AC24A'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: 'bottom'
                }
            }
        });
    }

    createBarChart(transactions) {
        const ctx = document.getElementById('barChart').getContext('2d');
        const reportType = document.getElementById('reportType').value;
        let labels = [];
        let incomeData = [];
        let expenseData = [];
        
        // Generate data based on report type
        if (reportType === 'weekly') {
            // Last 7 days
            labels = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return date.toLocaleDateString('en-US', { weekday: 'short' });
            });
            
            incomeData = labels.map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                const dateStr = date.toISOString().split('T')[0];
                return transactions
                    .filter(t => t.type === 'income' && t.date === dateStr)
                    .reduce((sum, t) => sum + t.amount, 0);
            });
            
            expenseData = labels.map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                const dateStr = date.toISOString().split('T')[0];
                return transactions
                    .filter(t => t.type === 'expense' && t.date === dateStr)
                    .reduce((sum, t) => sum + t.amount, 0);
            });
        } else if (reportType === 'monthly') {
            // Last 12 months
            labels = Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - (11 - i));
                return date.toLocaleDateString('en-US', { month: 'short' });
            });
            
            incomeData = labels.map((_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - (11 - i));
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                return transactions
                    .filter(t => {
                        if (t.type !== 'income') return false;
                        const [tYear, tMonth] = t.date.split('-').map(Number);
                        return tYear === year && tMonth === month;
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
            });
            
            expenseData = labels.map((_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - (11 - i));
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                return transactions
                    .filter(t => {
                        if (t.type !== 'expense') return false;
                        const [tYear, tMonth] = t.date.split('-').map(Number);
                        return tYear === year && tMonth === month;
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
            });
        } else if (reportType === 'yearly') {
            // Last 5 years
            labels = Array.from({ length: 5 }, (_, i) => {
                const date = new Date();
                return (date.getFullYear() - (4 - i)).toString();
            });
            
            incomeData = labels.map(year => {
                return transactions
                    .filter(t => {
                        if (t.type !== 'income') return false;
                        const tYear = t.date.split('-')[0];
                        return tYear === year;
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
            });
            
            expenseData = labels.map(year => {
                return transactions
                    .filter(t => {
                        if (t.type !== 'expense') return false;
                        const tYear = t.date.split('-')[0];
                        return tYear === year;
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
            });
        }
        
        if (this.barChart) {
            this.barChart.destroy();
        }
        
        this.barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: '#2ecc71',
                        borderColor: '#27ae60',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: '#e74c3c',
                        borderColor: '#c0392b',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createPieChart(transactions) {
        const ctx = document.getElementById('pieChart').getContext('2d');
        const categories = [...new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))];
        const data = categories.map(category => {
            return transactions
                .filter(t => t.category === category && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
        });
        
        if (this.pieChart) {
            this.pieChart.destroy();
        }
        
        this.pieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#8AC24A'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: 'bottom'
                }
            }
        });
    }

    updateCategoriesTable(categories) {
        const tbody = document.getElementById('categoriesTableBody');
        tbody.innerHTML = '';
        
        if (categories.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-muted text-center">
                        No categories found. Add your first category!
                    </td>
                </tr>
            `;
            return;
        }

        categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.name}</td>
                <td>
                    <span class="badge ${category.type === 'income' ? 'badge-success' : 'badge-danger'}">
                        ${category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                    </span>
                </td>
                <td>${category.budgetLimit ? `$${category.budgetLimit.toFixed(2)}` : 'None'}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="expenseTracker.editCategory('${category.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="expenseTracker.deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    openModal(mode, transaction = null) {
        const modal = document.getElementById('transactionModal');
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitBtn');
        
        if (mode === 'add') {
            modalTitle.textContent = 'Add New Transaction';
            submitBtn.textContent = 'Add Transaction';
            document.getElementById('transactionForm').reset();
            document.getElementById('transactionId').value = '';
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
        } else if (mode === 'edit' && transaction) {
            modalTitle.textContent = 'Edit Transaction';
            submitBtn.textContent = 'Update Transaction';
            document.getElementById('transactionId').value = transaction.id;
            document.getElementById('transactionType').value = transaction.type;
            document.getElementById('amount').value = transaction.amount;
            document.getElementById('description').value = transaction.description;
            document.getElementById('category').value = transaction.category;
            document.getElementById('date').value = transaction.date;
        }
        
        modal.classList.add('show');
    }

    openCategoryModal(mode, category = null) {
        const modal = document.getElementById('categoryModal');
        const modalTitle = document.getElementById('categoryModalTitle');
        const submitBtn = document.getElementById('saveCategoryBtn');
        
        if (mode === 'add') {
            modalTitle.textContent = 'Add New Category';
            submitBtn.textContent = 'Add Category';
            document.getElementById('categoryForm').reset();
            document.getElementById('categoryId').value = '';
        } else if (mode === 'edit' && category) {
            modalTitle.textContent = 'Edit Category';
            submitBtn.textContent = 'Update Category';
            document.getElementById('categoryId').value = category.id;
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryType').value = category.type;
            document.getElementById('categoryBudget').value = category.budgetLimit || '';
        }
        
        modal.classList.add('show');
    }

    closeModal() {
        const modal = document.getElementById('transactionModal');
        modal.classList.remove('show');
    }

    closeCategoryModal() {
        const modal = document.getElementById('categoryModal');
        modal.classList.remove('show');
    }

    async handleTransactionSubmit(e) {
        e.preventDefault();
        
        const transactionId = document.getElementById('transactionId').value;
        const type = document.getElementById('transactionType').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value.trim();
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        
        if (!type || !amount || !description || !category || !date) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        const transactions = JSON.parse(localStorage.getItem('expenseTrackerTransactions')) || [];
        
        if (transactionId) {
            // Update existing transaction
            const index = transactions.findIndex(t => t.id === transactionId);
            if (index !== -1) {
                transactions[index] = {
                    ...transactions[index],
                    type,
                    amount,
                    description,
                    category,
                    date
                };
            }
        } else {
            // Add new transaction
            const newTransaction = {
                id: 'trans_' + Date.now(),
                userId: this.currentUser.id,
                type,
                amount,
                description,
                category,
                date,
                createdAt: new Date().toISOString()
            };
            transactions.push(newTransaction);
        }

        localStorage.setItem('expenseTrackerTransactions', JSON.stringify(transactions));
        
        const settings = this.getUserSettings();
        if (settings.enableNotifications) {
            // Check single expense threshold
            if (type === 'expense' && amount > settings.expenseThreshold) {
                this.showNotification(
                    `⚠️ High expense alert! $${amount} exceeds your threshold of $${settings.expenseThreshold}`,
                    'error'
                );
            }
            
            // Check category budget threshold
            const categoryObj = this.getCategoryByName(category);
            if (categoryObj?.budgetLimit) {
                const categoryTotal = this.getCategoryTotal(categoryObj.name);
                const percentage = (categoryTotal / categoryObj.budgetLimit) * 100;
                
                if (percentage >= settings.budgetThreshold) {
                    this.showNotification(
                        `⚠️ ${categoryObj.name} budget reached ${Math.round(percentage)}% of limit!`,
                        'error'
                    );
                }
            }
        }
        
        this.loadUserData();
        this.closeModal();
        this.showNotification('Transaction saved successfully!', 'success');
    }

    getCategoryByName(name) {
        const categories = JSON.parse(localStorage.getItem('expenseTrackerCategories')) || [];
        return categories.find(c => c.name === name && c.userId === this.currentUser.id);
    }

    getCategoryTotal(categoryName) {
        const transactions = JSON.parse(localStorage.getItem('expenseTrackerTransactions')) || [];
        return transactions
            .filter(t => 
                t.userId === this.currentUser.id && 
                t.type === 'expense' && 
                t.category === categoryName
            )
            .reduce((sum, t) => sum + t.amount, 0);
    }

    async handleCategorySubmit(e) {
        e.preventDefault();
        
        const categoryId = document.getElementById('categoryId').value;
        const name = document.getElementById('categoryName').value.trim();
        const type = document.getElementById('categoryType').value;
        const budgetLimit = document.getElementById('categoryBudget').value ? 
            parseFloat(document.getElementById('categoryBudget').value) : null;
        
        if (!name || !type) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const categories = JSON.parse(localStorage.getItem('expenseTrackerCategories')) || [];
        
        if (categoryId) {
            // Update existing category
            const index = categories.findIndex(c => c.id === categoryId);
            if (index !== -1) {
                categories[index] = {
                    ...categories[index],
                    name,
                    type,
                    budgetLimit
                };
            }
        } else {
            // Add new category
            const newCategory = {
                id: 'cat_' + Date.now(),
                userId: this.currentUser.id,
                name,
                type,
                budgetLimit
            };
            categories.push(newCategory);
        }
        
        localStorage.setItem('expenseTrackerCategories', JSON.stringify(categories));
        this.loadUserData();
        this.closeCategoryModal();
        this.showNotification('Category saved successfully!', 'success');
    }

    editTransaction(transactionId) {
        const transactions = JSON.parse(localStorage.getItem('expenseTrackerTransactions')) || [];
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
            this.openModal('edit', transaction);
        }
    }

    editCategory(categoryId) {
        const categories = JSON.parse(localStorage.getItem('expenseTrackerCategories')) || [];
        const category = categories.find(c => c.id === categoryId);
        if (category) {
            this.openCategoryModal('edit', category);
        }
    }

    deleteTransaction(transactionId) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const transactions = JSON.parse(localStorage.getItem('expenseTrackerTransactions')) || [];
            const updatedTransactions = transactions.filter(t => t.id !== transactionId);
            localStorage.setItem('expenseTrackerTransactions', JSON.stringify(updatedTransactions));
            this.loadUserData();
            this.showNotification('Transaction deleted successfully!', 'success');
        }
    }

    deleteCategory(categoryId) {
        if (confirm('Are you sure you want to delete this category?')) {
            // First check if there are any transactions using this category
            const transactions = JSON.parse(localStorage.getItem('expenseTrackerTransactions')) || [];
            const transactionsUsingCategory = transactions.some(t => t.category === categoryId);
            
            if (transactionsUsingCategory) {
                this.showNotification('Cannot delete category: it is being used by transactions', 'error');
                return;
            }
            
            const categories = JSON.parse(localStorage.getItem('expenseTrackerCategories')) || [];
            const updatedCategories = categories.filter(c => c.id !== categoryId);
            localStorage.setItem('expenseTrackerCategories', JSON.stringify(updatedCategories));
            this.loadUserData();
            this.showNotification('Category deleted successfully!', 'success');
        }
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });
        
        // Show active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
            }
        });
        
        // Load data for the tab if needed
        this.loadUserData();
    }

    updateTimeDisplay() {
        const timeDisplay = document.querySelector('.time-dropdown .dropbtn');
        if (timeDisplay) {
            const timeText = this.currentTimeRange.charAt(0).toUpperCase() + this.currentTimeRange.slice(1);
            timeDisplay.innerHTML = `<i class="fas fa-clock"></i> ${timeText} <i class="fas fa-caret-down"></i>`;
        }
    }

    showNotification(message, type) {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        notificationMessage.textContent = message;
        notification.className = `notification ${type} show`;

        setTimeout(() => {
            notification.className = 'notification hidden';
        }, 3000);
    }
}

// Initialize the application
const expenseTracker = new ExpenseTracker();