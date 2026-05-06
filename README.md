# datatable-visibility-settings

`datatable-visibility-settings` is a reusable plugin for jQuery DataTables that:

- Creates and manages its own modal UI
- Injects isolated default styles automatically
- Handles column visibility + order (with ColReorder)
- Supports drag sorting (Sortable.js)
- Persists user preferences (custom storage/localStorage)
- Can be customized with theme, texts, callbacks, and row rendering

## Installation

```bash
npm install @eswact/datatable-visibility-settings
```

## Quick start

```js
const DataTableVisibilitySettings = require('@eswact/datatable-visibility-settings');

const table = $('#customers').DataTable({
  data,
  colReorder: true,
  columns: [
    { data: 'username', title: 'Username', name: 'username' },
    { data: 'company', title: 'Company', name: 'company' },
    { data: 'phone', title: 'Phone', name: 'phone' },
    { data: 'email', title: 'Email', name: 'email' },
    { data: null, title: 'Process', name: 'process' }
  ]
});

const tableColumns = [
  { id: 0, name: 'username', title: 'Username', check: false, checkId: null },
  { id: 1, name: 'company', title: 'Company', check: true, checkId: 'companyCheck' },
  { id: 2, name: 'phone', title: 'Phone', check: true, checkId: 'phoneCheck' },
  { id: 3, name: 'email', title: 'Email', check: true, checkId: 'emailCheck' },
  { id: 4, name: 'process', title: 'Process', check: false, checkId: null }
];

const visibilitySettings = new DataTableVisibilitySettings({
  table,
  columns: tableColumns
});

// open modal from your toolbar button
visibilitySettings.open();
```

## Peer dependencies

- `jquery` `>=3.6.0`
- `datatables.net` `>=1.13.7`
- `datatables.net-colreorder` `>=1.6.2`
- `sortablejs` `>=1.15.0`

## Advanced usage

```js
const DataTableVisibilitySettings = require('@eswact/datatable-visibility-settings');

const visibilitySettings = new DataTableVisibilitySettings({
  table,
  columns: tableColumns,
  storageKey: 'customers-table-pref',
  theme: {
    accentColor: '#ee605f',
    accentSoftColor: 'rgba(238, 96, 95, 0.2)'
  },
  texts: {
    title: 'Customize Table',
    save: 'Save'
  },
  onSave: (state) => {
    console.log('saved state', state);
  }
});

// open from your toolbar button
visibilitySettings.open();
```

## Browser usage (direct script)

When loaded via script tag, class is available on `window.DataTableVisibilitySettings`.

```js
const plugin = new window.DataTableVisibilitySettings({
  table,
  columns: tableColumns
});
plugin.open();
```

## Main API

- `open()`
- `close()`
- `reset()`
- `getState()`
- `setState()`
- `destroy()`

## Customization points

- `theme` (colors/z-index)
- `texts` (title/buttons)
- `classPrefix` (CSS namespace)
- `renderOptionRow` (custom list row HTML)
- `storage` adapter (`get/set/remove`)
- callbacks: `onOpen`, `onChange`, `onSave`, `onReset`

## Notes

- Legacy helper functions still exist as static methods for backward compatibility.
- For drag sorting, `Sortable` should be available (global in script-tag usage).
- DataTables columns should have a `name` value to allow reliable visibility/order mapping.
