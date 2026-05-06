const DEFAULT_THEME = {
    overlayBg: 'rgba(0, 0, 0, 0.7)',
    modalBg: '#ffffff',
    titleColor: '#232323',
    subtitleColor: '#444444',
    borderColor: '#dddddd',
    accentColor: '#ee605f',
    accentSoftColor: 'rgba(238, 96, 95, 0.2)',
    buttonTextColor: '#ffffff',
    zIndex: 120
};

const DEFAULT_TEXTS = {
    title: 'Customize Table',
    subtitle: 'Select and sort the columns you want to display.',
    save: 'Save & Continue',
    reset: 'Return to default settings'
};

class DataTableVisibilitySettings {
    constructor(options) {
        this.table = options.table;
        this.columns = options.columns || [];
        this.classPrefix = options.classPrefix || 'dtvs';
        this.theme = Object.assign({}, DEFAULT_THEME, options.theme || {});
        this.texts = Object.assign({}, DEFAULT_TEXTS, options.texts || {});
        this.storageKey = options.storageKey || 'datatable-visibility-settings';
        this.storage = options.storage || {
            get: (key) => JSON.parse(window.localStorage.getItem(key)),
            set: (key, value) => window.localStorage.setItem(key, JSON.stringify(value)),
            remove: (key) => window.localStorage.removeItem(key)
        };
        this.enableDrag = options.enableDrag !== false;
        this.enableVisibility = options.enableVisibility !== false;
        this.persist = options.persist !== false;
        this.fixedColumns = options.fixedColumns || [];
        this.excludedColumns = options.excludedColumns || [];
        this.onOpen = options.onOpen || null;
        this.onChange = options.onChange || null;
        this.onSave = options.onSave || null;
        this.onReset = options.onReset || null;
        this.onError = options.onError || null;
        this.renderOptionRow = options.renderOptionRow || null;

        this.state = this.resolveInitialState(options.defaultState || {});
        this.nodes = {};
        this.sortableInstance = null;

        this.createModal();
        this.injectStyles();
        this.renderColumns();
        this.attachEvents();
        this.applyStateToTable();
    }

    resolveInitialState(defaultState) {
        const fallbackOrder = this.columns.map((c) => c.id);
        const fallbackVisibility = {};
        this.columns.forEach((c) => {
            fallbackVisibility[c.name] = true;
        });

        if (!this.persist) {
            return {
                order: defaultState.order || fallbackOrder,
                visibility: Object.assign(fallbackVisibility, defaultState.visibility || {})
            };
        }

        const stored = this.storage.get(this.storageKey);
        if (stored && Array.isArray(stored.order) && stored.visibility) {
            return {
                order: stored.order,
                visibility: Object.assign(fallbackVisibility, stored.visibility)
            };
        }

        return {
            order: defaultState.order || fallbackOrder,
            visibility: Object.assign(fallbackVisibility, defaultState.visibility || {})
        };
    }

    getVisibleColumns() {
        return this.columns.filter((c) => !this.excludedColumns.includes(c.id));
    }

    createModal() {
        const id = `${this.classPrefix}-modal`;
        const existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = id;
        modal.className = `${this.classPrefix}-modal`;
        modal.innerHTML = `
            <div class="${this.classPrefix}-panel">
                <div class="${this.classPrefix}-header">
                    <div>
                        <h3 class="${this.classPrefix}-title">${this.texts.title}</h3>
                        <p class="${this.classPrefix}-subtitle">${this.texts.subtitle}</p>
                    </div>
                    <button type="button" class="${this.classPrefix}-close-btn" aria-label="Close">
                        <svg viewBox="0 0 512 512" aria-hidden="true">
                            <path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm91.3 270.6c6.2 6.2 6.2 16.4 0 22.6l-6.1 6.1c-6.2 6.2-16.4 6.2-22.6 0L256 284.7l-62.6 62.6c-6.2 6.2-16.4 6.2-22.6 0l-6.1-6.1c-6.2-6.2-6.2-16.4 0-22.6L227.3 256l-62.6-62.6c-6.2-6.2-6.2-16.4 0-22.6l6.1-6.1c6.2-6.2 16.4-6.2 22.6 0l62.6 62.6 62.6-62.6c6.2-6.2 16.4-6.2 22.6 0l6.1 6.1c6.2 6.2 6.2 16.4 0 22.6L284.7 256l62.6 62.6z"></path>
                        </svg>
                    </button>
                </div>
                <ul class="${this.classPrefix}-list"></ul>
                <div class="${this.classPrefix}-actions">
                    <button type="button" class="${this.classPrefix}-save-btn">${this.texts.save}</button>
                    <button type="button" class="${this.classPrefix}-reset-btn">${this.texts.reset}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.nodes.modal = modal;
        this.nodes.list = modal.querySelector(`.${this.classPrefix}-list`);
        this.nodes.closeBtn = modal.querySelector(`.${this.classPrefix}-close-btn`);
        this.nodes.saveBtn = modal.querySelector(`.${this.classPrefix}-save-btn`);
        this.nodes.resetBtn = modal.querySelector(`.${this.classPrefix}-reset-btn`);
    }

    renderColumns() {
        const orderedColumns = this.state.order
            .map((id) => this.columns.find((c) => c.id === id))
            .filter(Boolean)
            .filter((c) => !this.excludedColumns.includes(c.id));

        this.nodes.list.innerHTML = orderedColumns.map((column) => {
            const isFixed = this.fixedColumns.includes(column.id);
            const isCheckable = this.enableVisibility && column.check && !isFixed;
            const checked = this.state.visibility[column.name] !== false;

            if (this.renderOptionRow) {
                return this.renderOptionRow(column, { isFixed, isCheckable, checked });
            }

            return `
                <li class="${this.classPrefix}-item" data-id="${column.id}">
                    <label class="${this.classPrefix}-option">
                        ${isCheckable ? `<input type="checkbox" data-name="${column.name}" ${checked ? 'checked' : ''} />` : ''}
                        <span>${column.title}</span>
                    </label>
                    ${this.enableDrag && !isFixed ? `
                    <button type="button" class="${this.classPrefix}-drag-handle" aria-label="Drag">
                        <svg viewBox="0 0 640 640" aria-hidden="true">
                            <path d="M288 104C288 81.9 270.1 64 248 64L200 64C177.9 64 160 81.9 160 104L160 152C160 174.1 177.9 192 200 192L248 192C270.1 192 288 174.1 288 152L288 104zM288 296C288 273.9 270.1 256 248 256L200 256C177.9 256 160 273.9 160 296L160 344C160 366.1 177.9 384 200 384L248 384C270.1 384 288 366.1 288 344L288 296zM160 488L160 536C160 558.1 177.9 576 200 576L248 576C270.1 576 288 558.1 288 536L288 488C288 465.9 270.1 448 248 448L200 448C177.9 448 160 465.9 160 488zM480 104C480 81.9 462.1 64 440 64L392 64C369.9 64 352 81.9 352 104L352 152C352 174.1 369.9 192 392 192L440 192C462.1 192 480 174.1 480 152L480 104zM352 296L352 344C352 366.1 369.9 384 392 384L440 384C462.1 384 480 366.1 480 344L480 296C480 273.9 462.1 256 440 256L392 256C369.9 256 352 273.9 352 296zM480 488C480 465.9 462.1 448 440 448L392 448C369.9 448 352 465.9 352 488L352 536C352 558.1 369.9 576 392 576L440 576C462.1 576 480 558.1 480 536L480 488z"></path>
                        </svg>
                    </button>` : ''}
                </li>
            `;
        }).join('');

        this.setupDrag();
    }

    setupDrag() {
        if (!this.enableDrag || typeof Sortable === 'undefined') {
            return;
        }

        if (this.sortableInstance) {
            this.sortableInstance.destroy();
        }

        this.sortableInstance = new Sortable(this.nodes.list, {
            animation: 150,
            handle: `.${this.classPrefix}-drag-handle`,
            forceFallback: true,
            onEnd: () => this.syncOrderFromDom()
        });
    }

    syncOrderFromDom() {
        const ids = [];
        this.nodes.list.querySelectorAll(`.${this.classPrefix}-item`).forEach((item) => {
            ids.push(parseInt(item.dataset.id, 10));
        });
        this.state.order = ids;
        this.emitChange();
    }

    syncVisibilityFromDom() {
        const visibility = Object.assign({}, this.state.visibility);
        this.nodes.list.querySelectorAll('input[type="checkbox"][data-name]').forEach((el) => {
            visibility[el.dataset.name] = el.checked;
        });
        this.state.visibility = visibility;
        this.emitChange();
    }

    applyStateToTable() {
        if (!this.table) return;

        const currentIndexes = this.state.order
            .map((id) => {
                const col = this.columns.find((c) => c.id === id);
                return col ? this.table.column(`${col.name}:name`).index() : null;
            })
            .filter((idx) => idx !== null);

        if (this.table.colReorder && currentIndexes.length > 0) {
            this.table.colReorder.order(currentIndexes);
        }

        this.columns.forEach((col) => {
            const visible = this.state.visibility[col.name] !== false;
            this.table.column(`${col.name}:name`).visible(visible);
        });
    }

    attachEvents() {
        this.nodes.closeBtn.addEventListener('click', () => this.close());
        this.nodes.saveBtn.addEventListener('click', () => {
            this.syncVisibilityFromDom();
            this.applyStateToTable();
            this.persistState();
            if (this.onSave) this.onSave(this.getState());
            this.close();
        });
        this.nodes.resetBtn.addEventListener('click', () => {
            this.reset();
            if (this.onReset) this.onReset(this.getState());
            this.close();
        });
        this.nodes.list.addEventListener('change', (e) => {
            if (e.target && e.target.matches('input[type="checkbox"][data-name]')) {
                this.syncVisibilityFromDom();
            }
        });
        this.nodes.modal.addEventListener('click', (e) => {
            if (e.target === this.nodes.modal) {
                this.close();
            }
        });
    }

    persistState() {
        if (!this.persist) return;
        this.storage.set(this.storageKey, this.state);
    }

    emitChange() {
        if (this.onChange) this.onChange(this.getState());
    }

    open() {
        this.renderColumns();
        this.nodes.modal.classList.add('open');
        if (this.onOpen) this.onOpen(this.getState());
    }

    close() {
        this.nodes.modal.classList.remove('open');
    }

    reset() {
        this.state.order = this.columns.map((c) => c.id);
        this.state.visibility = {};
        this.columns.forEach((c) => {
            this.state.visibility[c.name] = true;
        });
        this.renderColumns();
        this.applyStateToTable();
        this.persistState();
    }

    getState() {
        return {
            order: [...this.state.order],
            visibility: Object.assign({}, this.state.visibility)
        };
    }

    setState(state) {
        this.state = {
            order: Array.isArray(state.order) ? [...state.order] : [...this.state.order],
            visibility: Object.assign({}, this.state.visibility, state.visibility || {})
        };
        this.renderColumns();
        this.applyStateToTable();
        this.persistState();
    }

    destroy() {
        if (this.sortableInstance) this.sortableInstance.destroy();
        if (this.nodes.modal) this.nodes.modal.remove();
        const style = document.getElementById(`${this.classPrefix}-styles`);
        if (style) style.remove();
    }

    injectStyles() {
        const styleId = `${this.classPrefix}-styles`;
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .${this.classPrefix}-modal, .${this.classPrefix}-modal * { box-sizing: border-box; }
            .${this.classPrefix}-modal {
                position: fixed; inset: 0; z-index: ${this.theme.zIndex}; display: none;
                align-items: center; justify-content: center; padding: 20px;
                background: ${this.theme.overlayBg};
            }
            .${this.classPrefix}-modal.open { display: flex; }
            .${this.classPrefix}-panel {
                width: min(460px, 100%); max-height: 90vh; overflow: hidden;
                display: flex; flex-direction: column; gap: 16px; padding: 20px;
                border-radius: 12px; background: ${this.theme.modalBg};
            }
            .${this.classPrefix}-header { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
            .${this.classPrefix}-title { margin: 0; font-size: 22px; color: ${this.theme.titleColor}; }
            .${this.classPrefix}-subtitle { margin: 6px 0 0; font-size: 13px; color: ${this.theme.subtitleColor}; }
            .${this.classPrefix}-close-btn {
                background: transparent;
                border: none;
                color: ${this.theme.accentColor};
                cursor: pointer;
                display: inline-flex; align-items: center; justify-content: center;
            }
            .${this.classPrefix}-close-btn svg { width: 32px; height: 32px; fill: currentColor; }
            .${this.classPrefix}-list { list-style: none; margin: 0; padding: 2px; display: flex; flex-direction: column; gap: 8px; overflow: auto; }
            .${this.classPrefix}-item {
                display: flex; align-items: center; gap: 8px; border: 1px solid ${this.theme.borderColor};
                border-radius: 8px; padding: 10px 12px;
            }
            .${this.classPrefix}-option { flex: 1; display: flex; align-items: center; gap: 8px; user-select: none; }
            .${this.classPrefix}-option input { accent-color: ${this.theme.accentColor}; }
            .${this.classPrefix}-drag-handle {
                border: none; background: transparent; color: ${this.theme.accentColor};
                width: 28px; height: 28px; cursor: grab;
            }
            .${this.classPrefix}-drag-handle svg { width: 18px; height: 18px; fill: currentColor; }
            .${this.classPrefix}-actions { display: flex; flex-direction: column; gap: 10px; }
            .${this.classPrefix}-save-btn, .${this.classPrefix}-reset-btn {
                border: 1px solid ${this.theme.accentColor}; border-radius: 10px; padding: 10px 12px;
                font-weight: 600; cursor: pointer;
            }
            .${this.classPrefix}-save-btn { background: ${this.theme.accentColor}; color: ${this.theme.buttonTextColor}; }
            .${this.classPrefix}-reset-btn { background: ${this.theme.accentSoftColor}; color: ${this.theme.accentColor}; }
            @media (max-width: 768px) {
                .${this.classPrefix}-modal { padding: 0; }
                .${this.classPrefix}-panel { width: 100%; height: 100%; max-height: none; border-radius: 0; }
            }
        `;

        document.head.appendChild(style);
    }
}

function setlocalstorage(tmpname, tmpvalue) {
    window.localStorage.setItem(tmpname, JSON.stringify(tmpvalue));
}
function getlocalstorage(tmpname) {
    return JSON.parse(window.localStorage.getItem(tmpname));
}
function SetUserPrefs(visibilityPref, orderPref) {
    setlocalstorage('orderPref', orderPref);
    setlocalstorage('visibilityPref', visibilityPref);
}

let legacyInstance = null;
function ensureLegacyInstance(table, tableColumns, orderPref, visibilityPref) {
    if (!legacyInstance) {
        legacyInstance = new DataTableVisibilitySettings({
            table: table,
            columns: tableColumns,
            defaultState: { order: orderPref, visibility: visibilityPref },
            persist: false
        });
    }
    return legacyInstance;
}
function SetVsColumns(table, tableColumns, orderPref, visibilityPref) {
    const inst = ensureLegacyInstance(table, tableColumns, orderPref, visibilityPref);
    inst.setState({ order: orderPref, visibility: visibilityPref });
}
function SetLabelsFirstData() {}
function setColumnVisibility(table, tableColumns, visibilityPref) {
    const inst = ensureLegacyInstance(table, tableColumns, tableColumns.map((c) => c.id), visibilityPref || {});
    const state = inst.getState();
    state.visibility = Object.assign({}, state.visibility, visibilityPref || {});
    inst.setState(state);
    return inst.getState().visibility;
}
function setColumnOrder(table, orderPref) {
    const inst = ensureLegacyInstance(table, [], orderPref, {});
    inst.setState({ order: orderPref });
    return inst.getState().order;
}
function setDefaultColumnOrder(table, orderPref) {
    const inst = ensureLegacyInstance(table, [], orderPref, {});
    inst.reset();
    return inst.getState().order;
}
function resetColReorderMD(tableId) {
    $($(tableId).DataTable().columns().header()).each(function () {
        const md = $._data($(this)[0]).events.mousedown;
        if (!md) return;
        for (let i = 0, l = md.length; i < l; i++) {
            if (md[i].namespace === 'ColReorder') {
                md[i].handler = function () {};
            }
        }
    });
}
function visSettingsClose() { if (legacyInstance) legacyInstance.close(); }
function visSettingsOpen() { if (legacyInstance) legacyInstance.open(); }

DataTableVisibilitySettings.setlocalstorage = setlocalstorage;
DataTableVisibilitySettings.getlocalstorage = getlocalstorage;
DataTableVisibilitySettings.SetUserPrefs = SetUserPrefs;
DataTableVisibilitySettings.SetVsColumns = SetVsColumns;
DataTableVisibilitySettings.SetLabelsFirstData = SetLabelsFirstData;
DataTableVisibilitySettings.setColumnVisibility = setColumnVisibility;
DataTableVisibilitySettings.setColumnOrder = setColumnOrder;
DataTableVisibilitySettings.setDefaultColumnOrder = setDefaultColumnOrder;
DataTableVisibilitySettings.resetColReorderMD = resetColReorderMD;
DataTableVisibilitySettings.visSettingsClose = visSettingsClose;
DataTableVisibilitySettings.visSettingsOpen = visSettingsOpen;

if (typeof window !== 'undefined') {
    window.DataTableVisibilitySettings = DataTableVisibilitySettings;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataTableVisibilitySettings;
}