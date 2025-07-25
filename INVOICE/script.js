// script.js
class InvoiceSystem {
    constructor() {
        this.items = [];
        this.invoiceCounter = this.getStoredInvoiceCounter();
        this.currentInvoiceData = {};
        this.currencySymbols = {
            'XAF': 'FCFA',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'NGN': '₦',
            'GHS': '₵'
        };
        
        this.init();
    }

    init() {
        this.generateInvoiceNumber();
        this.setCurrentDate();
        this.bindEvents();
        this.loadSavedData();
        this.updateTotals();
    }

    bindEvents() {
        // Button events
        document.getElementById('addItemBtn').addEventListener('click', () => this.showAddItemForm());
        document.getElementById('saveItemBtn').addEventListener('click', () => this.saveItem());
        document.getElementById('cancelItemBtn').addEventListener('click', () => this.hideAddItemForm());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveInvoice());
        document.getElementById('printBtn').addEventListener('click', () => this.printInvoice());
        document.getElementById('newInvoiceBtn').addEventListener('click', () => this.newInvoice());

        // Item form events
        document.getElementById('itemQuantity').addEventListener('input', () => this.calculateItemTotal());
        document.getElementById('itemPrice').addEventListener('input', () => this.calculateItemTotal());

        // Totals events
        document.getElementById('taxRate').addEventListener('input', () => this.updateTotals());
        document.getElementById('discountRate').addEventListener('input', () => this.updateTotals());

        // Sort events
        document.getElementById('sortBy').addEventListener('change', (e) => this.sortItems(e.target.value));

        // Currency change event
        document.getElementById('currency').addEventListener('change', () => this.updateTotals());

        // Auto-save events
        this.bindAutoSaveEvents();
    }

    bindAutoSaveEvents() {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.id !== 'itemDescription' && input.id !== 'itemQuantity' && 
                input.id !== 'itemPrice' && input.id !== 'itemTotal') {
                input.addEventListener('input', () => this.autoSave());
            }
        });
    }

    generateInvoiceNumber() {
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(this.invoiceCounter).padStart(4, '0')}`;
        document.getElementById('invoiceNumber').value = invoiceNumber;
    }

    setCurrentDate() {
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 30);

        document.getElementById('invoiceDate').value = today.toISOString().split('T')[0];
        document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
    }

    showAddItemForm() {
        document.getElementById('addItemForm').classList.remove('hidden');
        document.getElementById('itemDescription').focus();
        this.clearItemForm();
    }

    hideAddItemForm() {
        document.getElementById('addItemForm').classList.add('hidden');
        this.clearItemForm();
    }

    clearItemForm() {
        document.getElementById('itemDescription').value = '';
        document.getElementById('itemQuantity').value = '1';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemTotal').value = '';
    }

    calculateItemTotal() {
        const quantity = parseFloat(document.getElementById('itemQuantity').value) || 0;
        const price = parseFloat(document.getElementById('itemPrice').value) || 0;
        const total = quantity * price;
        document.getElementById('itemTotal').value = total.toFixed(2);
    }

    saveItem() {
        const description = document.getElementById('itemDescription').value.trim();
        const quantity = parseFloat(document.getElementById('itemQuantity').value);
        const price = parseFloat(document.getElementById('itemPrice').value);

        if (!description || !quantity || !price) {
            alert('Please fill in all item fields');
            return;
        }

        const item = {
            id: Date.now(),
            description,
            quantity,
            price,
            total: quantity * price
        };

        this.items.push(item);
        this.renderItems();
        this.updateTotals();
        this.hideAddItemForm();
        this.autoSave();
    }

    editItem(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            document.getElementById('itemDescription').value = item.description;
            document.getElementById('itemQuantity').value = item.quantity;
            document.getElementById('itemPrice').value = item.price;
            this.calculateItemTotal();
            this.showAddItemForm();
            this.deleteItem(id);
        }
    }

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.renderItems();
        this.updateTotals();
        this.autoSave();
    }

    renderItems() {
        const tbody = document.getElementById('itemsTableBody');
        tbody.innerHTML = '';

        this.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${this.formatCurrency(item.price)}</td>
                <td>${this.formatCurrency(item.total)}</td>
                <td>
                    <button class="btn btn-edit" onclick="invoiceSystem.editItem(${item.id})">Edit</button>
                    <button class="btn btn-danger" onclick="invoiceSystem.deleteItem(${item.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    sortItems(criteria) {
        if (!criteria) return;

        this.items.sort((a, b) => {
            switch (criteria) {
                case 'description':
                    return a.description.localeCompare(b.description);
                case 'quantity':
                    return a.quantity - b.quantity;
                case 'price':
                    return a.price - b.price;
                case 'total':
                    return a.total - b.total;
                default:
                    return 0;
            }
        });

        this.renderItems();
        this.autoSave();
    }

    updateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        const discountRate = parseFloat(document.getElementById('discountRate').value) || 0;

        const taxAmount = (subtotal * taxRate) / 100;
        const discountAmount = (subtotal * discountRate) / 100;
        const grandTotal = subtotal + taxAmount - discountAmount;

        document.getElementById('subtotal').textContent = this.formatCurrency(subtotal);
        document.getElementById('taxAmount').textContent = this.formatCurrency(taxAmount);
        document.getElementById('discountAmount').textContent = this.formatCurrency(discountAmount);
        document.getElementById('grandTotal').textContent = this.formatCurrency(grandTotal);
    }

    formatCurrency(amount) {
        const currency = document.getElementById('currency').value;
        const symbol = this.currencySymbols[currency] || currency;
        
        if (currency === 'XAF') {
            return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${symbol}`;
        } else {
            return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }

    getStoredInvoiceCounter() {
        const stored = JSON.parse(localStorage.getItem('invoiceCounter') || '1');
        return parseInt(stored);
    }

    incrementInvoiceCounter() {
        this.invoiceCounter++;
        localStorage.setItem('invoiceCounter', JSON.stringify(this.invoiceCounter));
    }

    autoSave() {
        const invoiceData = this.gatherInvoiceData();
        localStorage.setItem('currentInvoice', JSON.stringify(invoiceData));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('currentInvoice');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.populateForm(data);
        }
    }

    populateForm(data) {
        // Company details
        if (data.companyName) document.getElementById('companyName').value = data.companyName;
        if (data.companyAddress) document.getElementById('companyAddress').value = data.companyAddress;
        if (data.companyPhone) document.getElementById('companyPhone').value = data.companyPhone;
        if (data.companyEmail) document.getElementById('companyEmail').value = data.companyEmail;

        // Customer details
        if (data.customerName) document.getElementById('customerName').value = data.customerName;
        if (data.customerAddress) document.getElementById('customerAddress').value = data.customerAddress;
        if (data.customerPhone) document.getElementById('customerPhone').value = data.customerPhone;
        if (data.customerEmail) document.getElementById('customerEmail').value = data.customerEmail;

        // Invoice details
        if (data.invoiceDate) document.getElementById('invoiceDate').value = data.invoiceDate;
        if (data.dueDate) document.getElementById('dueDate').value = data.dueDate;
        if (data.currency) document.getElementById('currency').value = data.currency;
        if (data.taxRate) document.getElementById('taxRate').value = data.taxRate;
        if (data.discountRate) document.getElementById('discountRate').value = data.discountRate;
        if (data.notes) document.getElementById('invoiceNotes').value = data.notes;

        // Items
        if (data.items) {
            this.items = data.items;
            this.renderItems();
        }

        this.updateTotals();
    }

    gatherInvoiceData() {
        return {
            invoiceNumber: document.getElementById('invoiceNumber').value,
            companyName: document.getElementById('companyName').value,
            companyAddress: document.getElementById('companyAddress').value,
            companyPhone: document.getElementById('companyPhone').value,
            companyEmail: document.getElementById('companyEmail').value,
            customerName: document.getElementById('customerName').value,
            customerAddress: document.getElementById('customerAddress').value,
            customerPhone: document.getElementById('customerPhone').value,
            customerEmail: document.getElementById('customerEmail').value,
            invoiceDate: document.getElementById('invoiceDate').value,
            dueDate: document.getElementById('dueDate').value,
            currency: document.getElementById('currency').value,
            taxRate: document.getElementById('taxRate').value,
            discountRate: document.getElementById('discountRate').value,
            notes: document.getElementById('invoiceNotes').value,
            items: this.items,
            timestamp: new Date().toISOString()
        };
    }

    saveInvoice() {
        const invoiceData = this.gatherInvoiceData();
        
        // Validate required fields
        if (!invoiceData.companyName || !invoiceData.customerName || this.items.length === 0) {
            alert('Please fill in company name, customer name, and add at least one item.');
            return;
        }

        // Save to localStorage with invoice number as key
        const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices') || '{}');
        savedInvoices[invoiceData.invoiceNumber] = invoiceData;
        localStorage.setItem('savedInvoices', JSON.stringify(savedInvoices));

        alert(`Invoice ${invoiceData.invoiceNumber} saved successfully!`);
        this.incrementInvoiceCounter();
    }

    newInvoice() {
        if (confirm('Are you sure you want to create a new invoice? Any unsaved changes will be lost.')) {
            // Clear all form fields
            document.querySelectorAll('input, textarea, select').forEach(element => {
                if (element.type === 'date') {
                    // Keep date fields with current values
                    return;
                } else if (element.id === 'currency') {
                    element.value = 'XAF';
                } else if (element.id === 'taxRate' || element.id === 'discountRate') {
                    element.value = '0';
                } else if (element.id !== 'invoiceNumber') {
                    element.value = '';
                }
            });

            // Clear items
            this.items = [];
            this.renderItems();
            this.updateTotals();

            // Generate new invoice number
            this.generateInvoiceNumber();
            this.setCurrentDate();

            // Clear localStorage current invoice
            localStorage.removeItem('currentInvoice');

            alert('New invoice created!');
        }
    }

    prepareForPrint() {
        const data = this.gatherInvoiceData();

        // Populate print layout
        document.getElementById('printCompanyName').textContent = data.companyName || 'Company Name';
        document.getElementById('printCompanyAddress').innerHTML = (data.companyAddress || 'Company Address').replace(/\n/g, '<br>');
        document.getElementById('printCompanyContact').innerHTML = `
            ${data.companyPhone ? `Phone: ${data.companyPhone}<br>` : ''}
            ${data.companyEmail ? `Email: ${data.companyEmail}` : ''}
        `;

        document.getElementById('printInvoiceNumber').textContent = data.invoiceNumber;
        document.getElementById('printInvoiceDate').textContent = this.formatDate(data.invoiceDate);
        document.getElementById('printDueDate').textContent = this.formatDate(data.dueDate);

        document.getElementById('printCustomerName').textContent = data.customerName || 'Customer Name';
        document.getElementById('printCustomerAddress').innerHTML = (data.customerAddress || 'Customer Address').replace(/\n/g, '<br>');
        document.getElementById('printCustomerContact').innerHTML = `
            ${data.customerPhone ? `Phone: ${data.customerPhone}<br>` : ''}
            ${data.customerEmail ? `Email: ${data.customerEmail}` : ''}
        `;

        // Populate items table
        const printTbody = document.getElementById('printItemsTableBody');
        printTbody.innerHTML = '';
        this.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${this.formatCurrency(item.price)}</td>
                <td>${this.formatCurrency(item.total)}</td>
            `;
            printTbody.appendChild(row);
        });

        // Populate totals
        const subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
        const taxRate = parseFloat(data.taxRate) || 0;
        const discountRate = parseFloat(data.discountRate) || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const discountAmount = (subtotal * discountRate) / 100;
        const grandTotal = subtotal + taxAmount - discountAmount;

        document.getElementById('printSubtotal').textContent = this.formatCurrency(subtotal);
        document.getElementById('printTaxAmount').textContent = this.formatCurrency(taxAmount);
        document.getElementById('printDiscountAmount').textContent = this.formatCurrency(discountAmount);
        document.getElementById('printGrandTotal').textContent = this.formatCurrency(grandTotal);

        document.getElementById('printNotes').innerHTML = (data.notes || '').replace(/\n/g, '<br>');
    }

    printInvoice() {
        if (this.items.length === 0) {
            alert('Please add at least one item before printing.');
            return;
        }

        this.prepareForPrint();
        
        // Show print layout temporarily
        const printLayout = document.getElementById('printLayout');
        const originalDisplay = printLayout.style.display;
        printLayout.classList.remove('hidden');
        
        // Print
        window.print();
        
        // Hide print layout again
        if (originalDisplay === 'none' || originalDisplay === '') {
            printLayout.classList.add('hidden');
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Initialize the invoice system when the page loads
let invoiceSystem;
document.addEventListener('DOMContentLoaded', function() {
    invoiceSystem = new InvoiceSystem();
});

// Add some utility functions for debugging and testing
window.invoiceSystem = null;
window.addEventListener('load', function() {
    if (!window.invoiceSystem) {
        window.invoiceSystem = invoiceSystem;
    }
});