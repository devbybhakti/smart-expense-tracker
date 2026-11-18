
// ==========================================
// SMART EXPENSE TRACKER
// ==========================================

// Get HTML elements
const form = document.getElementById("expense-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const transactionList = document.getElementById("transaction-list");
const searchInput = document.getElementById("search-transaction");
const filterType = document.getElementById("filter-type");
const filterCategory = document.getElementById("filter-category");

const totalIncomeElement = document.getElementById("total-income");
const totalExpensesElement = document.getElementById("total-expenses");
const balanceElement = document.getElementById("balance");

const budgetInput = document.getElementById("budget-amount");
const saveBudgetButton = document.getElementById("save-budget");
const budgetStatus = document.getElementById("budget-status");
const budgetProgress = document.getElementById("budget-progress-bar");
const budgetMessage = document.getElementById("budget-message");

// Get today's date in local time
const today = new Date();

function getTodayDate() {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

dateInput.value = getTodayDate();

// ==========================================
// LOAD AND SAVE DATA
// ==========================================

function loadTransactions() {
    try {
        const savedData = localStorage.getItem("transactions");
        const parsedData = savedData ? JSON.parse(savedData) : [];

        return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
        console.error("Could not load transactions:", error);
        return [];
    }
}

let transactions = loadTransactions();

function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

let expenseChart = null;

// ==========================================
// ADD NEW TRANSACTION
// ==========================================

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);

    if (!description || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid description and amount.");
        return;
    }

    const transaction = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        description: description,
        amount: amount,
        type: typeInput.value,
        category: categoryInput.value,
        date: dateInput.value
    };

    transactions.push(transaction);

    saveTransactions();
    updateDashboard();

    form.reset();
    dateInput.value = getTodayDate();
});

// ==========================================
// UPDATE INCOME, EXPENSES AND BALANCE
// ==========================================

function updateSummary() {
    const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpenses;

    totalIncomeElement.textContent =
        "₹" + totalIncome.toFixed(2);

    totalExpensesElement.textContent =
        "₹" + totalExpenses.toFixed(2);

    balanceElement.textContent =
        "₹" + balance.toFixed(2);
}

// ==========================================
// DISPLAY TRANSACTIONS
// ==========================================

function displayTransactions() {
    transactionList.replaceChildren();

    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedType = filterType.value;
    const selectedCategory = filterCategory.value;

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch =
            t.description.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm);

        const matchesType =
            selectedType === "all" || t.type === selectedType;

        const matchesCategory =
            selectedCategory === "all" || t.category === selectedCategory;

        return matchesSearch && matchesType && matchesCategory;
    });

    if (filteredTransactions.length === 0) {
        const message = document.createElement("p");

        message.textContent = transactions.length === 0
            ? "No transactions yet. Add your first transaction!"
            : "No matching transactions found.";

        transactionList.appendChild(message);
        return;
    }

    filteredTransactions.slice().reverse().forEach(t => {
        const item = document.createElement("div");
        item.className = "transaction-item";

        const details = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = t.description;

        const info = document.createElement("small");
        info.textContent = t.category + " | " + t.date;

        details.append(name, document.createElement("br"), info);

        const amount = document.createElement("span");
        amount.className = t.type;

        amount.textContent =
            (t.type === "income" ? "+ ₹" : "- ₹") +
            Number(t.amount).toFixed(2);

        // Edit button
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-btn";

        editButton.addEventListener("click", function() {
            editTransaction(t.id);
        });

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", function() {
            deleteTransaction(t.id);
        });

        item.append(details, amount, editButton, deleteButton);
        transactionList.appendChild(item);
    });
}

// ==========================================
// EDIT TRANSACTION
// ==========================================

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);

    if (!transaction) return;

    const newDescription = prompt(
        "Enter new description:",
        transaction.description
    );

    if (newDescription === null) return;

    const newAmount = prompt(
        "Enter new amount:",
        transaction.amount
    );

    if (newAmount === null) return;

    const updatedAmount = Number(newAmount);

    if (!newDescription.trim() ||
        !Number.isFinite(updatedAmount) ||
        updatedAmount <= 0) {
        alert("Please enter valid details.");
        return;
    }

    transaction.description = newDescription.trim();
    transaction.amount = updatedAmount;

    saveTransactions();
    updateDashboard();
}

// ==========================================
// DELETE TRANSACTION
// ==========================================

function deleteTransaction(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    transactions = transactions.filter(t => t.id !== id);

    saveTransactions();
    updateDashboard();
}

// ==========================================
// SEARCH AND FILTER
// ==========================================

searchInput.addEventListener("input", displayTransactions);

filterType.addEventListener("change", displayTransactions);

filterCategory.addEventListener("change", displayTransactions);

// ==========================================
// MONTHLY BUDGET
// ==========================================

function updateBudget() {
    const now = new Date();

    const monthlyExpenses = transactions
        .filter(t => {
            const transactionDate = new Date(t.date + "T00:00:00");

            return t.type === "expense" &&
                transactionDate.getMonth() === now.getMonth() &&
                transactionDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

    if (monthlyBudget <= 0) {
        budgetStatus.textContent = "No budget set yet";
        budgetProgress.style.width = "0%";
        budgetMessage.textContent =
            "Set a budget to track your spending.";
        return;
    }

    budgetInput.value = monthlyBudget;

    const percentage = (monthlyExpenses / monthlyBudget) * 100;
    const remaining = monthlyBudget - monthlyExpenses;

    budgetStatus.textContent =
        "Spent: ₹" + monthlyExpenses.toFixed(2) +
        " / ₹" + monthlyBudget.toFixed(2);

    budgetProgress.style.width =
        Math.min(percentage, 100) + "%";

    if (remaining >= 0) {
        budgetMessage.textContent =
            "Remaining budget: ₹" + remaining.toFixed(2);

        budgetProgress.style.backgroundColor = "#36bfa6";
    } else {
        budgetMessage.textContent =
            "Budget exceeded by ₹" + Math.abs(remaining).toFixed(2);

        budgetProgress.style.backgroundColor = "#e05252";
    }
}

// Save monthly budget
saveBudgetButton.addEventListener("click", function() {
    const value = Number(budgetInput.value);

    if (!Number.isFinite(value) || value <= 0) {
        alert("Please enter a valid monthly budget.");
        return;
    }

    monthlyBudget = value;

    localStorage.setItem("monthlyBudget", monthlyBudget);

    updateBudget();

    alert("Monthly budget saved successfully!");
});

// ==========================================
// EXPENSE CHART
// ==========================================

function updateChart() {
    const categoryTotals = {};

    transactions
        .filter(t => t.type === "expense")
        .forEach(t => {
            categoryTotals[t.category] =
                (categoryTotals[t.category] || 0) + Number(t.amount);
        });

    const canvas = document.getElementById("expense-chart");

    if (expenseChart) {
        expenseChart.destroy();
        expenseChart = null;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js could not be loaded.");
        return;
    }

    expenseChart = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: Object.keys(categoryTotals),

            datasets: [{
                data: Object.values(categoryTotals),

                backgroundColor: [
                    "#6252df",
                    "#ff8c69",
                    "#36bfa6",
                    "#f5c451",
                    "#648de5",
                    "#d779bb",
                    "#999999"
                ],

                borderWidth: 2
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

// ==========================================
// EXPORT TRANSACTIONS TO CSV
// ==========================================

function exportTransactions() {
    if (transactions.length === 0) {
        alert("No transactions available to export.");
        return;
    }

    let csv = "Description,Amount,Type,Category,Date\n";

    transactions.forEach(t => {
        const description = String(t.description).replace(/"/g, '""');

        csv += `"${description}",${t.amount},"${t.type}","${t.category}","${t.date}"\n`;
    });

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "my-transactions.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// ==========================================
// REFRESH COMPLETE DASHBOARD
// ==========================================

function updateDashboard() {
    updateSummary();
    displayTransactions();
    updateBudget();
    updateChart();
}

// Load dashboard when website opens
updateDashboard();
