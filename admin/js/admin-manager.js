// admin/js/admin-manager.js

/**
 * AdminManager - Gestión principal del panel de administración
 */
class AdminManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.editingItemId = null;
        this.initializeData();
    }

    /**
     * Inicializa los datos del sistema
     */
    initializeData() {
        // Cargar datos desde localStorage o inicializar con valores por defecto
        this.products = JSON.parse(localStorage.getItem('admin_products')) || [];
        this.categories = JSON.parse(localStorage.getItem('admin_categories')) || this.getDefaultCategories();
        this.sales = JSON.parse(localStorage.getItem('admin_sales')) || [];
        this.customers = JSON.parse(localStorage.getItem('admin_customers')) || [];
        this.inventory = JSON.parse(localStorage.getItem('admin_inventory')) || [];
        this.settings = JSON.parse(localStorage.getItem('admin_settings')) || this.getDefaultSettings();
        
        // Guardar categorías por defecto si no existen
        if (!localStorage.getItem('admin_categories')) {
            localStorage.setItem('admin_categories', JSON.stringify(this.categories));
        }
    }

    /**
     * Obtiene categorías por defecto
     */
    getDefaultCategories() {
        return [
            { id: 1, name: "Pantallas", description: "Displays LCD, LED, OLED", icon: "fas fa-tv" },
            { id: 2, name: "Teclados", description: "Teclados de reemplazo", icon: "fas fa-keyboard" },
            { id: 3, name: "Baterías", description: "Baterías para laptops", icon: "fas fa-battery-three-quarters" },
            { id: 4, name: "Cargadores", description: "Adaptadores de corriente", icon: "fas fa-plug" },
            { id: 5, name: "Memorias", description: "RAM DDR3, DDR4, DDR5", icon: "fas fa-memory" },
            { id: 6, name: "Almacenamiento", description: "SSD, HDD, M.2 NVMe", icon: "fas fa-hdd" }
        ];
    }

    /**
     * Obtiene configuración por defecto
     */
    getDefaultSettings() {
        return {
            company: {
                name: "PrismaTech",
                rfc: "",
                phone: "(238) 123-4567",
                whatsapp: "5212381234567",
                email: "info@prismatech.mx",
                website: "www.prismatech.mx",
                address: "Teziutlán, Puebla, México"
            },
            system: {
                enableNotifications: true,
                enableStockAlerts: true,
                defaultMinStock: 5,
                currency: "MXN"
            }
        };
    }

    /**
     * Cambia de página
     */
    showPage(pageId) {
        // Actualizar navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const navItem = document.querySelector(`[data-page="${pageId}"]`);
        if (navItem) navItem.classList.add('active');

        // Mostrar página
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        const page = document.getElementById(`${pageId}-page`);
        if (page) page.classList.add('active');

        // Cargar datos de la página
        this.currentPage = pageId;
        this.loadPageData(pageId);
        
        // Cerrar sidebar en móvil
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('mobile-open');
        }
    }

    /**
     * Carga los datos de una página específica
     */
    loadPageData(pageId) {
        switch(pageId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'inventory':
                this.loadInventory();
                break;
            case 'sales':
                this.loadSales();
                break;
            case 'customers':
                this.loadCustomers();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    /**
     * Carga el dashboard
     */
    loadDashboard() {
        // Actualizar estadísticas
        document.getElementById('total-products').textContent = this.products.length;
        document.getElementById('total-categories').textContent = this.categories.length;
        document.getElementById('total-quotes').textContent = this.sales.length;
        document.getElementById('total-customers').textContent = this.customers.length;
        
        // Actualizar fecha actual
        const now = new Date();
        document.getElementById('current-date').textContent = 
            now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        // Cargar actividad reciente
        this.loadRecentActivity();
        
        // Cargar productos con bajo stock
        this.loadLowStockProducts();
    }

    /**
     * Carga actividad reciente
     */
    loadRecentActivity() {
        const container = document.getElementById('recent-activity');
        const activities = this.getRecentActivities();
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay actividad reciente</p>';
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${this.getTimeAgo(activity.date)}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Obtiene actividades recientes
     */
    getRecentActivities() {
        const activities = [];
        
        // Agregar ventas recientes
        this.sales.slice(-3).forEach(sale => {
            activities.push({
                type: 'success',
                icon: 'fas fa-shopping-cart',
                title: `Nueva cotización para ${sale.customer}`,
                date: new Date(sale.date)
            });
        });
        
        // Agregar productos agregados recientemente
        this.products.slice(-2).forEach(product => {
            activities.push({
                type: 'warning',
                icon: 'fas fa-box',
                title: `Producto agregado: ${product.name}`,
                date: new Date(product.created_at || Date.now())
            });
        });
        
        return activities.sort((a, b) => b.date - a.date).slice(0, 5);
    }

    /**
     * Carga productos con bajo stock
     */
    loadLowStockProducts() {
        const container = document.getElementById('low-stock-products');
        const lowStock = this.products.filter(p => {
            const inv = this.inventory.find(i => i.product_id === p.id);
            return inv && inv.stock < (inv.min_stock || this.settings.system.defaultMinStock);
        });
        
        if (lowStock.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay productos con stock bajo</p>';
            return;
        }
        
        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${lowStock.map(product => {
                        const inv = this.inventory.find(i => i.product_id === product.id);
                        return `
                            <tr>
                                <td>${product.name}</td>
                                <td><span class="badge badge-danger">${inv.stock}</span></td>
                                <td>${inv.min_stock || this.settings.system.defaultMinStock}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="adminManager.adjustInventory(${product.id})">
                                        <i class="fas fa-plus"></i> Reabastecer
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Carga productos
     */
    loadProducts() {
        const tbody = document.getElementById('products-table');
        const categoryFilter = document.getElementById('products-category-filter');
        
        // Cargar filtro de categorías
        categoryFilter.innerHTML = '<option value="">Todas las categorías</option>' +
            this.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        
        this.renderProducts();
    }

    /**
     * Renderiza productos
     */
    renderProducts() {
        const tbody = document.getElementById('products-table');
        const searchTerm = document.getElementById('products-search').value.toLowerCase();
        const categoryFilter = document.getElementById('products-category-filter').value;
        const statusFilter = document.getElementById('products-status-filter').value;
        
        let filtered = this.products.filter(product => {
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm) ||
                product.sku.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || product.category_id == categoryFilter;
            const matchesStatus = !statusFilter || 
                (statusFilter === 'active' && product.active !== false) ||
                (statusFilter === 'inactive' && product.active === false);
            
            return matchesSearch && matchesCategory && matchesStatus;
        });
        
        // Actualizar contador
        document.getElementById('products-count').textContent = `${filtered.length} productos`;
        
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-box"></i>
                        <div>No hay productos para mostrar</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = filtered.map(product => {
            const category = this.categories.find(c => c.id === product.category_id);
            const inv = this.inventory.find(i => i.product_id === product.id);
            const stock = inv ? inv.stock : 0;
            const stockStatus = stock === 0 ? 'danger' : stock < 10 ? 'warning' : 'success';
            
            return `
                <tr>
                    <td>
                        <div><strong>${product.name}</strong></div>
                        <small style="color: var(--gray-500);">${product.brand || ''}</small>
                    </td>
                    <td>${category ? category.name : 'Sin categoría'}</td>
                    <td><code>${product.sku}</code></td>
                    <td><span class="badge badge-${stockStatus}">${stock}</span></td>
                    <td>
                        <span class="badge badge-${product.active !== false ? 'success' : 'danger'}">
                            ${product.active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="adminManager.editProduct(${product.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminManager.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Abre modal de producto
     */
    openProductModal(productId = null) {
        this.editingItemId = productId;
        const product = productId ? this.products.find(p => p.id === productId) : null;
        
        const modalHtml = `
            <div class="modal-overlay active" id="product-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${productId ? 'Editar' : 'Nuevo'} Producto</h3>
                        <button class="modal-close" onclick="adminManager.closeModal('product-modal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="product-form">
                            <div class="form-group">
                                <label class="form-label">Nombre del Producto *</label>
                                <input type="text" class="form-control" id="product-name" required 
                                       value="${product ? product.name : ''}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Categoría *</label>
                                    <select class="form-control" id="product-category" required>
                                        <option value="">Seleccionar categoría</option>
                                        ${this.categories.map(cat => `
                                            <option value="${cat.id}" ${product && product.category_id === cat.id ? 'selected' : ''}>
                                                ${cat.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Marca</label>
                                    <input type="text" class="form-control" id="product-brand" 
                                           value="${product ? product.brand || '' : ''}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">SKU *</label>
                                    <input type="text" class="form-control" id="product-sku" required 
                                           value="${product ? product.sku : ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Número de Parte</label>
                                    <input type="text" class="form-control" id="product-part-number" 
                                           value="${product ? product.part_number || '' : ''}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Stock Inicial</label>
                                    <input type="number" class="form-control" id="product-stock" value="0" min="0">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Stock Mínimo</label>
                                    <input type="number" class="form-control" id="product-min-stock" 
                                           value="${this.settings.system.defaultMinStock}" min="0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Descripción</label>
                                <textarea class="form-control" id="product-description" rows="3">${product ? product.description || '' : ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">
                                    <input type="checkbox" id="product-active" ${!product || product.active !== false ? 'checked' : ''}>
                                    Producto activo
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="adminManager.closeModal('product-modal')">Cancelar</button>
                        <button class="btn btn-primary" onclick="adminManager.saveProduct()">
                            <i class="fas fa-save"></i> Guardar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modals-container').innerHTML = modalHtml;
    }

    /**
     * Guarda producto
     */
    saveProduct() {
        const productData = {
            name: document.getElementById('product-name').value,
            category_id: parseInt(document.getElementById('product-category').value),
            brand: document.getElementById('product-brand').value,
            sku: document.getElementById('product-sku').value,
            part_number: document.getElementById('product-part-number').value,
            description: document.getElementById('product-description').value,
            active: document.getElementById('product-active').checked,
            icon: this.categories.find(c => c.id === parseInt(document.getElementById('product-category').value))?.icon || 'fas fa-cube'
        };
        
        if (this.editingItemId) {
            // Editar producto existente
            const index = this.products.findIndex(p => p.id === this.editingItemId);
            if (index !== -1) {
                this.products[index] = { ...this.products[index], ...productData };
            }
        } else {
            // Crear nuevo producto
            productData.id = Date.now();
            productData.created_at = new Date().toISOString();
            this.products.push(productData);
            
            // Crear entrada de inventario
            const stock = parseInt(document.getElementById('product-stock').value) || 0;
            const minStock = parseInt(document.getElementById('product-min-stock').value) || this.settings.system.defaultMinStock;
            
            this.inventory.push({
                id: Date.now(),
                product_id: productData.id,
                stock: stock,
                min_stock: minStock,
                location: 'Almacén Principal'
            });
            
            localStorage.setItem('admin_inventory', JSON.stringify(this.inventory));
        }
        
        localStorage.setItem('admin_products', JSON.stringify(this.products));
        this.closeModal('product-modal');
        this.renderProducts();
        this.showToast('Producto guardado correctamente', 'success');
    }

    /**
     * Elimina producto
     */
    deleteProduct(id) {
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            this.products = this.products.filter(p => p.id !== id);
            this.inventory = this.inventory.filter(i => i.product_id !== id);
            
            localStorage.setItem('admin_products', JSON.stringify(this.products));
            localStorage.setItem('admin_inventory', JSON.stringify(this.inventory));
            
            this.renderProducts();
            this.showToast('Producto eliminado', 'warning');
        }
    }

    /**
     * Muestra notificación toast
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'times-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Cierra modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    /**
     * Toggle sidebar móvil
     */
    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('mobile-open');
    }

    /**
     * Obtiene tiempo transcurrido
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'Hace un momento';
        if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} minutos`;
        if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
        if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} días`;
        
        return date.toLocaleDateString('es-MX');
    }

    /**
     * Exporta datos
     */
    exportData() {
        const data = {
            products: this.products,
            categories: this.categories,
            sales: this.sales,
            customers: this.customers,
            inventory: this.inventory,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prismatech_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Datos exportados correctamente', 'success');
    }

    /**
     * Cierra sesión
     */
    logout() {
        if (confirm('¿Deseas cerrar sesión?')) {
            window.location.href = '../index.html';
        }
    }
}

// Crear instancia global
window.adminManager = new AdminManager();