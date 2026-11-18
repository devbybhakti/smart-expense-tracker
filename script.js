
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
let transactions = [];

try {
    transactions = JSON.parse(
        localStorage.getItem("transactions")
    ) || [];
} catch (error) {
    transactions = [];
}

let expenseChart = null;

// Set today's date automatically
const today = new Date();
dateInput.value =
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");

// Save transactions in browser storage
function saveTransactions() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}

// Update income, expenses and balance
function updateSummary() {
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    document.getElementById("total-income").textContent =
        "₹" + income.toFixed(2);

    document.getElementById("total-expenses").textContent =
        "₹" + expenses.toFixed(2);

    document.getElementById("balance").textContent =
        "₹" + balance.toFixed(2);
}

// Display transaction history
function displayTransactions() {
    transactionList.replaceChildren();

    if (transactions.length === 0) {
        const message = document.createElement("p");
        message.textContent =
            "No transactions yet. Add your first transaction!";
        transactionList.appendChild(message);
        return;
    }

    transactions.slice().reverse().forEach(t => {
        const item = document.createElement("div");
        item.className = "transaction-item";

        const details = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = t.description;

        const info = document.createElement("small");
        info.textContent =
            t.category + " | " + t.date;

        details.append(name, document.createElement("br"), info);

        const amount = document.createElement("span");
        amount.className = t.type;
        amount.textContent =
            (t.type === "income" ? "+ ₹" : "- ₹") +
            t.amount.toFixed(2);

const editButton = document.createElement("button");
editButton.textContent = "Edit";
editButton.className = "edit-btn";

editButton.addEventListener("click", () => {
    const newDescription = prompt("Enter new description:", t.description);

    if (newDescription === null) return;

    const newAmount = prompt("Enter new amount:", t.amount);

    if (newAmount === null) return;

    const updatedAmount = Number(newAmount);

    if (!newDescription.trim() || !Number.isFinite(updatedAmount) || updatedAmount <= 0) {
        alert("Please enter valid details.");
        return;
    }

    t.description = newDescription.trim();
    t.amount = updatedAmount;

    localStorage.setItem("transactions", JSON.stringify(transactions));

    updateDashboard();
});

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteTransaction(t.id);
        });

        item.append(details, amount, editButton, deleteButton);
        transactionList.appendChild(item);
    });
}

// Add a new transaction
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);

    if (!description || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid description and amount.");
        return;
    }

    const transaction = {
        id: Date.now().toString() + Math.random(),
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

    dateInput.value =
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");
});

// Delete a transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);

    saveTransactions();
    updateDashboard();
}

// Create expense chart
function updateChart() {
    const categoryTotals = {};

    transactions
        .filter(t => t.type === "expense")
        .forEach(t => {
            categoryTotals[t.category] =
                (categoryTotals[t.category] || 0) + t.amount;
        });

    const canvas = document.getElementById("expense-chart");

    if (expenseChart) {
        expenseChart.destroy();
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

// Refresh the complete dashboard
function updateDashboard() {
    updateSummary();
    displayTransactions();
    updateChart();
}

// Load saved data when page opens
updateDashboard();

// MONTHLY BUDGET FEATURE

const budgetInput = document.getElementById("budget-amount");
const saveBudgetButton = document.getElementById("save-budget");
const budgetStatus = document.getElementById("budget-status");
const budgetProgress = document.getElementById("budget-progress-bar");
const budgetMessage = document.getElementById("budget-message");

let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

// Calculate expenses for the current month
function updateBudget() {
    const now = new Date();

    const monthlyExpenses = transactions
        .filter(t => {
            const transactionDate = new Date(t.date + "T00:00:00");

            return t.type === "expense" &&
                transactionDate.getMonth() === now.getMonth() &&
                transactionDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, t) => sum + t.amount, 0);

    if (monthlyBudget <= 0) {
        budgetStatus.textContent = "No budget set yet";
        budgetProgress.style.width = "0%";
        budgetMessage.textContent = "Set a budget to track your spending.";
        return;
    }

    const percentage = (monthlyExpenses / monthlyBudget) * 100;
    const remaining = monthlyBudget - monthlyExpenses;

    budgetInput.value = monthlyBudget;

    budgetStatus.textContent =
        "Spent: ₹" + monthlyExpenses.toFixed(2) +
        " / ₹" + monthlyBudget.toFixed(2);

    budgetProgress.style.width = Math.min(percentage, 100) + "%";

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

// Update budget whenever dashboard changes
const originalUpdateDashboard = updateDashboard;

updateDashboard = function() {
    originalUpdateDashboard();
    updateBudget();
};

// Load saved budget
updateBudget();

// EXPORT TRANSACTIONS TO CSV

function exportTransactions() {
    if (transactions.length === 0) {
        alert("No transactions available to export.");
        return;
    }

    let csv = "Description,Amount,Type,Category,Date\n";

    transactions.forEach(t => {
        csv += `"${t.description}",${t.amount},"${t.type}","${t.category}","${t.date}"\n`;
    });

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "my-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
}

