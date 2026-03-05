import { useEffect, useState, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { fetchShips } from './api';
import type { ShipData } from './api';

function getDpm(ship: ShipData, shellType: 'AP' | 'HE' | 'CS'): number | null {
  const art = ship.default_profile?.artillery;
  if (!art) return null;
  const shell = art.shells[shellType];
  if (!shell || !art.shot_delay) return null;

  let totalBarrels = 0;
  if (art.slots) {
    for (const key in art.slots) {
      const slot = art.slots[key];
      totalBarrels += (slot.guns || 0) * (slot.barrels || 0);
    }
  }
  if (totalBarrels === 0) return null;

  const shotsPerMin = 60 / art.shot_delay;
  return Math.round(shotsPerMin * totalBarrels * shell.damage);
}

const columnHelper = createColumnHelper<ShipData>();

const baseColumns = [
  columnHelper.accessor('name', {
    header: 'Ship',
    cell: info => <span className="font-semibold text-wows-text whitespace-nowrap">{info.getValue()}</span>,
  }),
  columnHelper.accessor('tier', {
    header: 'Tier',
    cell: info => <div className="text-center w-full">{info.getValue()}</div>,
  }),
  columnHelper.accessor('type', {
    header: 'Class',
    cell: info => <div className="text-center w-full text-wows-highlight">{info.getValue()}</div>,
  }),
  columnHelper.accessor('nation', {
    header: 'Nation',
    cell: info => <div className="text-center w-full">{info.getValue()}</div>,
  }),
];

const survivabilityColumns = [
  columnHelper.accessor(row => row.default_profile?.armour?.health, {
    id: 'hp',
    header: 'HP',
    cell: info => {
      const val = info.getValue();
      return <div className="text-right w-full">{val ? val.toLocaleString() : '-'}</div>;
    },
  }),
  columnHelper.accessor(row => row.default_profile?.armour?.flood_damage, {
    id: 'ptz',
    header: 'ПТЗ',
    cell: info => {
      const val = info.getValue();
      return <div className="text-right w-full text-gray-300">{val != null ? `${val} %` : '-'}</div>;
    },
  }),
  columnHelper.accessor(row => row.default_profile?.concealment?.detect_distance_by_ship, {
    id: 'concealment_base',
    header: 'Заметность (база)',
    cell: info => {
      const val = info.getValue();
      return <div className="text-right w-full text-gray-300">{val ? `${val.toFixed(2)} км` : '-'}</div>;
    },
  }),
  columnHelper.accessor(row => {
    const val = row.default_profile?.concealment?.detect_distance_by_ship;
    if (!val) return null;
    if (row.type === 'Submarine') return val;
    return row.name === 'Gearing' ? val * 0.75 : val * 0.8;
  }, {
    id: 'concealment_min',
    header: 'Заметность (мин)',
    cell: info => {
      const val = info.getValue();
      return <div className="text-right w-full text-wows-highlight">{val ? `${val.toFixed(2)} км` : '-'}</div>;
    },
  }),
];

const artilleryColumns = [
  columnHelper.accessor(row => row.default_profile?.artillery?.distance, {
    id: 'artillery_distance',
    header: 'Дальность ГК',
    cell: info => <div className="text-right w-full">{info.getValue() ? `${info.getValue()} км` : '-'}</div>,
  }),
  columnHelper.accessor(row => row.default_profile?.artillery?.shot_delay, {
    id: 'artillery_reload',
    header: 'Перезарядка',
    cell: info => <div className="text-right w-full">{info.getValue() ? `${info.getValue()} с` : '-'}</div>,
  }),
  columnHelper.accessor(row => row.default_profile?.artillery?.rotation_time, {
    id: 'artillery_rotation',
    header: 'Поворот башен',
    cell: info => <div className="text-right w-full">{info.getValue() ? `${info.getValue()} с` : '-'}</div>,
  }),
  columnHelper.accessor(row => row.default_profile?.artillery?.max_dispersion, {
    id: 'artillery_dispersion',
    header: 'Рассеивание',
    cell: info => <div className="text-right w-full">{info.getValue() ? `${info.getValue()} м` : '-'}</div>,
  }),
  columnHelper.accessor(row => getDpm(row, 'AP'), {
    id: 'dpm_ap',
    header: 'ДПМ ББ',
    cell: info => <div className="text-right w-full text-gray-300">{info.getValue() ? info.getValue()?.toLocaleString() : '-'}</div>,
  }),
  columnHelper.accessor(row => getDpm(row, 'HE'), {
    id: 'dpm_he',
    header: 'ДПМ ОФ',
    cell: info => <div className="text-right w-full text-orange-400">{info.getValue() ? info.getValue()?.toLocaleString() : '-'}</div>,
  }),
  columnHelper.accessor(row => getDpm(row, 'CS'), {
    id: 'dpm_sap',
    header: 'ДПМ ПББ',
    cell: info => <div className="text-right w-full text-red-400">{info.getValue() ? info.getValue()?.toLocaleString() : '-'}</div>,
  }),
];

const createShellColumns = (typeId: 'AP' | 'HE' | 'CS', label: string) => [
  columnHelper.accessor(row => row.default_profile?.artillery?.shells[typeId]?.damage, {
    id: `${typeId.toLowerCase()}_damage`,
    header: `Урон ${label}`,
    cell: info => <div className="text-right w-full">{info.getValue() ? info.getValue()?.toLocaleString() : '-'}</div>,
  }),
  columnHelper.accessor(row => row.default_profile?.artillery?.shells[typeId]?.bullet_mass, {
    id: `${typeId.toLowerCase()}_mass`,
    header: `Масса (кг)`,
    cell: info => <div className="text-right w-full">{info.getValue() ? info.getValue() : '-'}</div>,
  }),
  columnHelper.accessor(row => row.default_profile?.artillery?.shells[typeId]?.bullet_speed, {
    id: `${typeId.toLowerCase()}_speed`,
    header: `Скорость (м/с)`,
    cell: info => <div className="text-right w-full">{info.getValue() ? info.getValue() : '-'}</div>,
  }),
  ...(typeId === 'HE' ? [
    columnHelper.accessor(row => row.default_profile?.artillery?.shells.HE?.burn_probability, {
      id: 'he_burn',
      header: 'Шанс пожара',
      cell: info => <div className="text-right w-full text-orange-400">{info.getValue() != null ? `${info.getValue()} %` : '-'}</div>,
    })
  ] : []),
];

const apColumns = createShellColumns('AP', 'ББ');
const heColumns = createShellColumns('HE', 'ОФ');
const sapColumns = createShellColumns('CS', 'ПББ');

type TabId = 'survivability' | 'artillery' | 'ap' | 'he' | 'sap';

const ALL_TABS: { id: TabId; label: string }[] = [
  { id: 'survivability', label: 'Живучесть' },
  { id: 'artillery', label: 'ГК' },
  { id: 'ap', label: 'ББ' },
  { id: 'he', label: 'ОФ' },
  { id: 'sap', label: 'ПББ' },
];

function App() {
  const [data, setData] = useState<ShipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'tier', desc: true } // Default sorting by tier desc
  ]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    researchable: true,
    premium: true,
    test: false,
  });
  const [activeTab, setActiveTab] = useState<TabId>('survivability');

  useEffect(() => {
    fetchShips()
      .then(ships => {
        // Filter out rental/special ships starting with '[' unless it's explicitly needed, but let's keep the existing logic
        const filtered = ships.filter(ship => !ship.name.startsWith('['));
        setData(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(ship => {
      // If it's a test ship (has_demo_profile is true)
      if (ship.has_demo_profile) return filters.test;
      // If it's a premium or special ship
      if (ship.is_premium || ship.is_special) return filters.premium;
      // Otherwise, it's a researchable ship
      return filters.researchable;
    });
  }, [data, filters]);

  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter(tab => {
      if (tab.id === 'survivability') return true;
      return filteredData.some(ship => {
        const art = ship.default_profile?.artillery;
        if (!art) return false;
        if (tab.id === 'artillery') return true;
        if (tab.id === 'ap') return !!art.shells.AP;
        if (tab.id === 'he') return !!art.shells.HE;
        if (tab.id === 'sap') return !!art.shells.CS;
        return false;
      });
    });
  }, [filteredData]);

  useEffect(() => {
    if (!visibleTabs.some(t => t.id === activeTab)) {
      setActiveTab('survivability');
    }
  }, [visibleTabs, activeTab]);

  const activeColumns = useMemo(() => {
    switch (activeTab) {
      case 'artillery': return [...baseColumns, ...artilleryColumns];
      case 'ap': return [...baseColumns, ...apColumns];
      case 'he': return [...baseColumns, ...heColumns];
      case 'sap': return [...baseColumns, ...sapColumns];
      case 'survivability':
      default: return [...baseColumns, ...survivabilityColumns];
    }
  }, [activeTab]);

  const table = useReactTable({
    data: filteredData,
    columns: activeColumns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="min-h-screen bg-wows-bg flex flex-col items-center">
      <header className="w-full bg-wows-panel border-b border-wows-border p-4 sticky top-0 z-10 space-y-4">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-2xl font-bold text-wows-highlight">ShipTools</h1>
          
          {!loading && !error && (
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
                className="bg-wows-bg border border-wows-border text-wows-text text-sm rounded-md focus:ring-wows-highlight focus:border-wows-highlight block w-full pl-10 p-2 outline-none"
                placeholder="Search ships..."
              />
            </div>
          )}

          <div className="text-sm text-gray-400">
            {loading ? 'Loading...' : `Ships: ${table.getFilteredRowModel().rows.length} / ${data.length}`}
          </div>
        </div>

        {!loading && !error && (
          <div className="flex items-center gap-6 text-sm text-wows-text pb-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.researchable}
                  onChange={e => setFilters(f => ({ ...f, researchable: e.target.checked }))}
                  className="w-4 h-4 rounded border-wows-border text-wows-highlight focus:ring-wows-highlight bg-wows-bg"
                />
                <span className="group-hover:text-wows-highlight transition-colors">Прокачиваемые</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.premium}
                  onChange={e => setFilters(f => ({ ...f, premium: e.target.checked }))}
                  className="w-4 h-4 rounded border-wows-border text-wows-highlight focus:ring-wows-highlight bg-wows-bg"
                />
                <span className="group-hover:text-wows-highlight transition-colors">Премиум / Особые</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.test}
                  onChange={e => setFilters(f => ({ ...f, test: e.target.checked }))}
                  className="w-4 h-4 rounded border-wows-border text-wows-highlight focus:ring-wows-highlight bg-wows-bg"
                />
                <span className="group-hover:text-wows-highlight transition-colors">Тестовые</span>
              </label>
            </div>

            <div className="h-4 w-[1px] bg-wows-border" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters({ researchable: true, premium: true, test: true })}
                className="px-3 py-1 bg-wows-bg border border-wows-border rounded hover:border-wows-highlight hover:text-wows-highlight transition-all text-xs uppercase font-bold"
              >
                Все
              </button>
              <button
                onClick={() => setFilters({ researchable: false, premium: false, test: false })}
                className="px-3 py-1 bg-wows-bg border border-wows-border rounded hover:border-wows-highlight hover:text-wows-highlight transition-all text-xs uppercase font-bold"
              >
                Ничего
              </button>
            </div>
            
            <div className="h-4 w-[1px] bg-wows-border" />
            
            {/* Tabs */}
            <div className="flex items-center gap-2 ml-4">
              {visibleTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 border rounded text-xs uppercase font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-wows-highlight text-black border-wows-highlight'
                      : 'bg-wows-bg border-wows-border hover:border-wows-highlight hover:text-wows-highlight'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="w-full max-w-7xl p-4 flex-1 overflow-auto">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="rounded-lg border border-wows-border bg-wows-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-wows-panel border-b border-wows-border">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th 
                          key={header.id} 
                          className="px-4 py-3 cursor-pointer hover:bg-white/5 select-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: <ArrowUp className="w-3 h-3 text-wows-highlight" />,
                              desc: <ArrowDown className="w-3 h-3 text-wows-highlight" />,
                            }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="w-3 h-3 text-gray-600" />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id} 
                      className="border-b border-wows-border/50 hover:bg-white/5 transition-colors"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No data available. Have you synced the backend?
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;