// Workers Management Functions
function loadWorkersTable() {
    const tableBody = document.getElementById('workersTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = workers.map(worker => `
        <tr data-worker-id="${worker.id}">
            <td>${worker.id}</td>
            <td contenteditable="true" data-field="name">${worker.name}</td>
            <td contenteditable="true" data-field="role">
                <select onchange="updateWorkerField(${worker.id}, 'role', this.value)" 
                        style="border: none; background: transparent; width: 100%;">
                    <option value="laborer" ${worker.role === 'laborer' ? 'selected' : ''}>Laborer</option>
                    <option value="mason" ${worker.role === 'mason' ? 'selected' : ''}>Mason</option>
                    <option value="electrician" ${worker.role === 'electrician' ? 'selected' : ''}>Electrician</option>
                    <option value="plumber" ${worker.role === 'plumber' ? 'selected' : ''}>Plumber</option>
                    <option value="carpenter" ${worker.role === 'carpenter' ? 'selected' : ''}>Carpenter</option>
                    <option value="supervisor" ${worker.role === 'supervisor' ? 'selected' : ''}>Supervisor</option>
                    <option value="helper" ${worker.role === 'helper' ? 'selected' : ''}>Helper</option>
                </select>
            </td>
            <td contenteditable="true" data-field="dailyRate">₹${worker.dailyRate}</td>
            <td contenteditable="true" data-field="phone">${worker.phone}</td>
            <td contenteditable="true" data-field="address">${worker.address}</td>
            <td contenteditable="true" data-field="joinDate">${formatDate(worker.joinDate)}</td>
            <td>
                <select onchange="updateWorkerField(${worker.id}, 'status', this.value)" 
                        style="border: none; background: transparent;">
                    <option value="active" ${worker.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${worker.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    <option value="terminated" ${worker.status === 'terminated' ? 'selected' : ''}>Terminated</option>
                </select>
            </td>
            <td>
                <button class="btn btn-info" onclick="editWorker(${worker.id})" 
                        style="padding: 4px 8px; font-size: 12px; margin-right: 5px;">
                    ✏️ Edit
                </button>
                <button class="btn btn-danger" onclick="deleteWorker(${worker.id})" 
                        style="padding: 4px 8px; font-size: 12px;">
                    🗑️ Delete
                </button>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners for editable cells
    addEditableListeners();
}

function addEditableListeners() {
    const editableCells = document.querySelectorAll('#workersTableBody td[contenteditable="true"]');
    
    editableCells.forEach(cell => {
        // Store original value
        cell.dataset.originalValue = cell.textContent;
        
        cell.addEventListener('blur', function() {
            const workerId = parseInt(this.closest('tr').dataset.workerId);
            const field = this.dataset.field;
            let value = this.textContent.trim();
            
            // Validate and format value based on field
            if (field === 'dailyRate') {
                // Remove currency symbol and validate number
                value = value.replace('₹', '').trim();
                const numValue = parseFloat(value);
                
                if (isNaN(numValue) || numValue < 0) {
                    alert('Please enter a valid daily rate');
                    this.textContent = this.dataset.originalValue;
                    return;
                }
                value = numValue;
                this.textContent = `₹${numValue}`;
                
            } else if (field === 'phone') {
                // Validate phone number (basic validation for Indian numbers)
                const phoneRegex = /^[6-9]\d{9}$/;
                if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
                    alert('Please enter a valid 10-digit phone number');
                    this.textContent = this.dataset.originalValue;
                    return;
                }
                
            } else if (field === 'name') {
                if (value.length < 2) {
                    alert('Name must be at least 2 characters long');
                    this.textContent = this.dataset.originalValue;
                    return;
                }
                
            } else if (field === 'joinDate') {
                // Validate date format (DD/MM/YYYY or YYYY-MM-DD)
                const dateRegex = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})$/;
                if (!dateRegex.test(value)) {
                    alert('Please enter a valid date (DD/MM/YYYY or YYYY-MM-DD)');
                    this.textContent = this.dataset.originalValue;
                    return;
                }
                
                // Convert to standard format
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    alert('Please enter a valid date');
                    this.textContent = this.dataset.originalValue;
                    return;
                }
                value = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                this.textContent = formatDate(value);
            }
            
            // Update worker data if validation passed
            updateWorkerField(workerId, field, value);
            
            // Update original value for next edit
            this.dataset.originalValue = this.textContent;
        });
        
        // Handle Enter key to blur the cell
        cell.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
        
        // Handle Escape key to cancel edit
        cell.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.textContent = this.dataset.originalValue;
                this.blur();
            }
        });
    });
}

function updateWorkerField(workerId, field, value) {
    const workerIndex = workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) {
        alert('Worker not found');
        return;
    }
    
    const oldValue = workers[workerIndex][field];
    workers[workerIndex][field] = value;
    
    // Save to localStorage or your data storage
    saveWorkersData();
    
    // Show success message
    showNotification(`${field} updated successfully`, 'success');
    
    // Log the change for audit trail
    console.log(`Worker ${workerId}: ${field} changed from "${oldValue}" to "${value}"`);
}

function editWorker(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) {
        alert('Worker not found');
        return;
    }
    
    // Create and show edit modal
    const modal = createEditWorkerModal(worker);
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function deleteWorker(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) {
        alert('Worker not found');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${worker.name}? This action cannot be undone.`)) {
        const workerIndex = workers.findIndex(w => w.id === workerId);
        workers.splice(workerIndex, 1);
        
        // Save updated data
        saveWorkersData();
        
        // Reload table
        loadWorkersTable();
        
        showNotification(`${worker.name} has been deleted`, 'success');
    }
}

function createEditWorkerModal(worker) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background-color: #fefefe;
            margin: 5% auto;
            padding: 20px;
            border: 1px solid #888;
            width: 80%;
            max-width: 500px;
            border-radius: 8px;
        ">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Edit Worker: ${worker.name}</h3>
                <span class="close" style="font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
            </div>
            
            <form id="editWorkerForm">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Name:</label>
                    <input type="text" id="editName" value="${worker.name}" style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Role:</label>
                    <select id="editRole" style="width: 100%; padding: 8px; margin-top: 5px;">
                        <option value="laborer" ${worker.role === 'laborer' ? 'selected' : ''}>Laborer</option>
                        <option value="mason" ${worker.role === 'mason' ? 'selected' : ''}>Mason</option>
                        <option value="electrician" ${worker.role === 'electrician' ? 'selected' : ''}>Electrician</option>
                        <option value="plumber" ${worker.role === 'plumber' ? 'selected' : ''}>Plumber</option>
                        <option value="carpenter" ${worker.role === 'carpenter' ? 'selected' : ''}>Carpenter</option>
                        <option value="supervisor" ${worker.role === 'supervisor' ? 'selected' : ''}>Supervisor</option>
                        <option value="helper" ${worker.role === 'helper' ? 'selected' : ''}>Helper</option>
                    </select>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Daily Rate (₹):</label>
                    <input type="number" id="editDailyRate" value="${worker.dailyRate}" min="0" style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Phone:</label>
                    <input type="tel" id="editPhone" value="${worker.phone}" style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Address:</label>
                    <textarea id="editAddress" rows="3" style="width: 100%; padding: 8px; margin-top: 5px;">${worker.address}</textarea>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Status:</label>
                    <select id="editStatus" style="width: 100%; padding: 8px; margin-top: 5px;">
                        <option value="active" ${worker.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${worker.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="terminated" ${worker.status === 'terminated' ? 'selected' : ''}>Terminated</option>
                    </select>
                </div>
                
                <div class="form-actions" style="text-align: right; margin-top: 20px;">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="margin-right: 10px; padding: 8px 16px;">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="padding: 8px 16px;">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => modal.remove();
    
    const form = modal.querySelector('#editWorkerForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        
        const updatedWorker = {
            ...worker,
            name: document.getElementById('editName').value.trim(),
            role: document.getElementById('editRole').value,
            dailyRate: parseFloat(document.getElementById('editDailyRate').value),
            phone: document.getElementById('editPhone').value.trim(),
            address: document.getElementById('editAddress').value.trim(),
            status: document.getElementById('editStatus').value
        };
        
        // Validate data
        if (!updatedWorker.name || updatedWorker.name.length < 2) {
            alert('Please enter a valid name');
            return;
        }
        
        if (isNaN(updatedWorker.dailyRate) || updatedWorker.dailyRate < 0) {
            alert('Please enter a valid daily rate');
            return;
        }
        
        // Update worker in array
        const workerIndex = workers.findIndex(w => w.id === worker.id);
        workers[workerIndex] = updatedWorker;
        
        // Save and reload
        saveWorkersData();
        loadWorkersTable();
        
        modal.remove();
        showNotification('Worker updated successfully', 'success');
    };
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    return modal;
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
}

function saveWorkersData() {
    // Implement your data saving logic here
    // localStorage.setItem('workers', JSON.stringify(workers));
    console.log('Workers data saved');
}

function showNotification(message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 4px;
        z-index: 1001;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}