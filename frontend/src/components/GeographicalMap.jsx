import { useEffect, useMemo, useState } from 'react'
import {
  Map as MapIcon,
  TrendingUp,
  Info,
  Users,
  BarChart3,
  Activity,
  Building2,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Pause,
  X,
  GitCompare
} from 'lucide-react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps'
import farmerDataRaw from '../data/Farmer.json'
import femaleDataRaw from '../data/Female.json'
import fishermanDataRaw from '../data/Fisherman.json'
import studentDataRaw from '../data/Student.json'

const geoUrl = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson'

const CATEGORY_CONFIG = {
  all: {
    label: 'All Categories',
    description: 'Aggregated beneficiary footprint across all available datasets',
    unit: 'beneficiaries'
  },
  farmer: {
    label: 'Farmer',
    description: 'Farmer beneficiaries by state/UT',
    unit: 'beneficiaries'
  },
  female: {
    label: 'Female',
    description: 'Unique female beneficiaries (multi-period fiscal records)',
    unit: 'beneficiaries'
  },
  fisherman: {
    label: 'Fisherman',
    description: 'Marine and coastal beneficiary concentration',
    unit: 'beneficiaries'
  },
  student: {
    label: 'Student',
    description: 'Student beneficiaries by FY across states and UTs',
    unit: 'beneficiaries'
  }
}

const DATA_SOURCES = {
  farmer: farmerDataRaw,
  female: femaleDataRaw,
  fisherman: fishermanDataRaw,
  student: studentDataRaw,
}

const STATE_ALIASES = {
  'NCT of Delhi': 'Delhi',
  'National Capital Territory of Delhi': 'Delhi',
  'Orissa': 'Odisha',
  'Pondicherry': 'Puducherry',
  'Uttaranchal': 'Uttarakhand',
  'Jammu & Kashmir': 'Jammu and Kashmir',
  'Andaman & Nicobar Islands': 'Andaman and Nicobar Islands',
  'Dadra and Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'Dadra & Nagar Haveli and Daman & Diu': 'Dadra and Nagar Haveli and Daman and Diu'
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const cleaned = value.trim()
    if (!cleaned || cleaned.toLowerCase() === 'na' || cleaned.toLowerCase() === 'n/a') return null
    const parsed = Number(cleaned.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeStateName(name) {
  if (!name) return ''
  const clean = String(name).trim().replace(/\s+/g, ' ')
  return STATE_ALIASES[clean] || clean
}

function extractGeoStateName(properties = {}) {
  const raw =
    properties.st_nm ||
    properties.NAME_1 ||
    properties.name ||
    properties.NAME ||
    properties.State ||
    properties.STATE ||
    properties.state ||
    ''

  return normalizeStateName(raw)
}

function sumNumbers(values) {
  return values.reduce((acc, item) => acc + (toNumber(item) || 0), 0)
}

function buildCategoryDataset(category, rows) {
  const stateMap = new Map()

  const addState = (stateName, total = 0, trendByYear = null) => {
    const state = normalizeStateName(stateName)
    if (!state || state.toLowerCase() === 'grand total') return

    const previous = stateMap.get(state) || { state, value: 0, trendByYear: {} }
    previous.value += total || 0

    if (trendByYear) {
      Object.entries(trendByYear).forEach(([year, val]) => {
        previous.trendByYear[year] = (previous.trendByYear[year] || 0) + (val || 0)
      })
    }

    stateMap.set(state, previous)
  }

  rows.forEach((row) => {
    const state = row['State/UT']
    if (!state) return

    if (category === 'farmer') {
      const value = toNumber(row['No. of Beneficiaries']) || 0
      addState(state, value)
      return
    }

    if (category === 'fisherman') {
      const value = toNumber(row['Total Beneficiaries']) || 0
      addState(state, value)
      return
    }

    if (category === 'student') {
      const yearlyKeys = Object.keys(row).filter((key) => /^\d{4}-\d{2}$/.test(key))
      const trendByYear = {}
      yearlyKeys.forEach((year) => {
        trendByYear[year] = toNumber(row[year]) || 0
      })
      const value = toNumber(row.Sum) ?? sumNumbers(Object.values(trendByYear))
      addState(state, value || 0, trendByYear)
      return
    }

    if (category === 'female') {
      const fiscalFields = Object.keys(row).filter((key) => key.includes('FY '))
      const trendByYear = {}

      fiscalFields.forEach((key) => {
        const match = key.match(/FY\s(\d{4}-\d{2})/)
        const year = match ? match[1] : null
        const value = toNumber(row[key]) || 0
        if (year) {
          trendByYear[year] = (trendByYear[year] || 0) + value
        }
      })

      const explicitTotal = toNumber(row[''])
      const value = explicitTotal ?? sumNumbers(Object.values(trendByYear))
      addState(state, value || 0, trendByYear)
    }
  })

  return Array.from(stateMap.values())
}

function buildAllCategoryDataset(categoryDatasets) {
  const merged = new Map()

  Object.values(categoryDatasets).forEach((dataset) => {
    dataset.forEach((entry) => {
      const existing = merged.get(entry.state) || { state: entry.state, value: 0 }
      existing.value += entry.value || 0
      merged.set(entry.state, existing)
    })
  })

  return Array.from(merged.values())
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Math.round(value || 0))
}

function getHeatColor(value, min, max) {
  if (!value || value <= 0) return '#E5E7EB'
  if (max === min) return '#1D4ED8'

  const ratio = (value - min) / (max - min)
  if (ratio > 0.85) return '#1E3A8A'
  if (ratio > 0.65) return '#1D4ED8'
  if (ratio > 0.45) return '#2563EB'
  if (ratio > 0.25) return '#60A5FA'
  return '#BFDBFE'
}

function getDeltaColor(delta, maxAbs) {
  if (!delta || maxAbs <= 0) return '#E5E7EB'
  const ratio = Math.min(Math.abs(delta) / maxAbs, 1)

  if (delta > 0) {
    if (ratio > 0.85) return '#166534'
    if (ratio > 0.6) return '#16A34A'
    if (ratio > 0.35) return '#4ADE80'
    return '#BBF7D0'
  }

  if (ratio > 0.85) return '#991B1B'
  if (ratio > 0.6) return '#DC2626'
  if (ratio > 0.35) return '#F87171'
  return '#FECACA'
}

function buildAvailablePeriods(categoryDatasets, activeCategory) {
  if (activeCategory === 'female' || activeCategory === 'student') {
    const set = new Set()
    ;(categoryDatasets[activeCategory] || []).forEach((entry) => {
      Object.keys(entry.trendByYear || {}).forEach((period) => set.add(period))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }

  if (activeCategory === 'all') {
    const set = new Set()
    ;['female', 'student'].forEach((category) => {
      ;(categoryDatasets[category] || []).forEach((entry) => {
        Object.keys(entry.trendByYear || {}).forEach((period) => set.add(period))
      })
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }

  return []
}

function buildDatasetForCategoryPeriod(category, period, categoryDatasets) {
  if (!period) {
    if (category === 'all') return buildAllCategoryDataset(categoryDatasets)
    return categoryDatasets[category] || []
  }

  if (category === 'female' || category === 'student') {
    return (categoryDatasets[category] || []).map((entry) => ({
      ...entry,
      value: entry.trendByYear?.[period] || 0
    }))
  }

  if (category === 'all') {
    const merged = new Map()

    Object.keys(DATA_SOURCES).forEach((key) => {
      const dataset = buildDatasetForCategoryPeriod(key, period, categoryDatasets)
      dataset.forEach((entry) => {
        const existing = merged.get(entry.state) || { state: entry.state, value: 0, trendByYear: {} }
        existing.value += entry.value || 0
        merged.set(entry.state, existing)
      })
    })

    return Array.from(merged.values())
  }

  return categoryDatasets[category] || []
}

function getStateSeriesForCategory(stateName, category, categoryDatasets, periods) {
  const dataset = categoryDatasets[category] || []
  const stateEntry = dataset.find((entry) => entry.state === stateName)

  if (!stateEntry) return []

  if (!periods.length) {
    return [{ label: 'Total', value: stateEntry.value || 0 }]
  }

  return periods.map((period) => ({
    label: period,
    value: stateEntry.trendByYear?.[period] || 0
  }))
}

function buildSparklinePath(points, width, height) {
  if (!points.length) return ''
  const max = Math.max(...points.map((p) => p.value || 0), 1)
  const min = Math.min(...points.map((p) => p.value || 0), 0)
  const range = Math.max(max - min, 1)

  const d = points
    .map((point, idx) => {
      const x = (idx / Math.max(points.length - 1, 1)) * width
      const y = height - ((point.value - min) / range) * height
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return d
}

function GeographicalMap() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [hoveredState, setHoveredState] = useState('')
  const [pinnedState, setPinnedState] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [periodIndex, setPeriodIndex] = useState(0)
  const [compareMode, setCompareMode] = useState(false)
  const [compareCategory, setCompareCategory] = useState('farmer')

  const categoryDatasets = useMemo(() => {
    const base = {}
    Object.entries(DATA_SOURCES).forEach(([category, rows]) => {
      base[category] = buildCategoryDataset(category, rows)
    })
    return base
  }, [])

  const availablePeriods = useMemo(
    () => buildAvailablePeriods(categoryDatasets, activeCategory),
    [categoryDatasets, activeCategory]
  )

  const selectedPeriod = availablePeriods.length ? availablePeriods[periodIndex] : null

  const currentDataset = useMemo(
    () => buildDatasetForCategoryPeriod(activeCategory, selectedPeriod, categoryDatasets),
    [activeCategory, selectedPeriod, categoryDatasets]
  )

  const comparisonDataset = useMemo(
    () => buildDatasetForCategoryPeriod(compareCategory, selectedPeriod, categoryDatasets),
    [compareCategory, selectedPeriod, categoryDatasets]
  )

  useEffect(() => {
    setPeriodIndex(0)
    setIsPlaying(false)
  }, [activeCategory])

  useEffect(() => {
    if (activeCategory === compareCategory) {
      const fallback = Object.keys(CATEGORY_CONFIG).find(
        (key) => key !== 'all' && key !== activeCategory
      )
      if (fallback) setCompareCategory(fallback)
    }
  }, [activeCategory, compareCategory])

  useEffect(() => {
    if (!isPlaying || !availablePeriods.length) return undefined

    const timer = setInterval(() => {
      setPeriodIndex((prev) => {
        if (prev >= availablePeriods.length - 1) return 0
        return prev + 1
      })
    }, 1300)

    return () => clearInterval(timer)
  }, [isPlaying, availablePeriods.length])

  const stateValueMap = useMemo(() => {
    const map = new Map()
    currentDataset.forEach((entry) => {
      map.set(entry.state, entry.value)
    })
    return map
  }, [currentDataset])

  const compareStateValueMap = useMemo(() => {
    const map = new Map()
    comparisonDataset.forEach((entry) => {
      map.set(entry.state, entry.value)
    })
    return map
  }, [comparisonDataset])

  const deltaStateMap = useMemo(() => {
    const map = new Map()
    const stateSet = new Set([...stateValueMap.keys(), ...compareStateValueMap.keys()])
    stateSet.forEach((state) => {
      const a = stateValueMap.get(state) || 0
      const b = compareStateValueMap.get(state) || 0
      map.set(state, a - b)
    })
    return map
  }, [stateValueMap, compareStateValueMap])

  const maxAbsDelta = useMemo(() => {
    const values = Array.from(deltaStateMap.values()).map((val) => Math.abs(val || 0))
    return values.length ? Math.max(...values) : 0
  }, [deltaStateMap])

  const sortedDataset = useMemo(
    () => [...currentDataset].sort((a, b) => (b.value || 0) - (a.value || 0)),
    [currentDataset]
  )

  const sortedDeltaStates = useMemo(() => {
    return Array.from(deltaStateMap.entries())
      .map(([state, delta]) => ({ state, delta }))
      .sort((a, b) => b.delta - a.delta)
  }, [deltaStateMap])

  const gainers = sortedDeltaStates.slice(0, 5)
  const decliners = [...sortedDeltaStates].reverse().slice(0, 5)

  const minValue = sortedDataset.length > 0 ? (sortedDataset[sortedDataset.length - 1].value || 0) : 0
  const maxValue = sortedDataset.length > 0 ? (sortedDataset[0].value || 0) : 0
  const totalBeneficiaries = sortedDataset.reduce((sum, item) => sum + (item.value || 0), 0)
  const avgPerState = sortedDataset.length ? totalBeneficiaries / sortedDataset.length : 0
  const topFiveTotal = sortedDataset.slice(0, 5).reduce((sum, item) => sum + (item.value || 0), 0)
  const topFiveShare = totalBeneficiaries > 0 ? (topFiveTotal / totalBeneficiaries) * 100 : 0

  const activeState = pinnedState || hoveredState
  const activeStateData = sortedDataset.find((item) => item.state === activeState)
  const activeStateDelta = deltaStateMap.get(activeState) || 0

  const stateSeries = useMemo(() => {
    if (!activeState) return []

    if (activeCategory === 'all') {
      const periods = availablePeriods
      if (!periods.length) return [{ label: 'Total', value: activeStateData?.value || 0 }]

      return periods.map((period) => {
        let value = 0
        Object.keys(DATA_SOURCES).forEach((category) => {
          const categorySeries = getStateSeriesForCategory(activeState, category, categoryDatasets, [period])
          value += categorySeries[0]?.value || 0
        })
        return { label: period, value }
      })
    }

    return getStateSeriesForCategory(activeState, activeCategory, categoryDatasets, availablePeriods)
  }, [activeState, activeCategory, categoryDatasets, availablePeriods, activeStateData])

  const compareSeries = useMemo(() => {
    if (!activeState || !compareMode) return []
    return getStateSeriesForCategory(activeState, compareCategory, categoryDatasets, availablePeriods)
  }, [activeState, compareMode, compareCategory, categoryDatasets, availablePeriods])

  const categoryTrend = useMemo(() => {
    if (activeCategory === 'all') {
      return Object.keys(CATEGORY_CONFIG)
        .filter((key) => key !== 'all')
        .map((key) => ({
          label: CATEGORY_CONFIG[key].label,
          value: (categoryDatasets[key] || []).reduce((sum, row) => sum + (row.value || 0), 0)
        }))
    }

    const dataset = categoryDatasets[activeCategory] || []
    const trendMap = {}

    dataset.forEach((entry) => {
      if (!entry.trendByYear) return
      Object.entries(entry.trendByYear).forEach(([year, val]) => {
        trendMap[year] = (trendMap[year] || 0) + (val || 0)
      })
    })

    return Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value }))
  }, [activeCategory, categoryDatasets])

  const trendMax = categoryTrend.length ? Math.max(...categoryTrend.map((item) => item.value || 0)) : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-10 w-72 h-72 bg-cyan-400/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />

      <div className="max-w-[1440px] mx-auto space-y-6 relative z-10">
        <div className="bg-gradient-to-br from-white/95 to-slate-100/90 backdrop-blur-sm rounded-3xl border border-white/40 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.6)] p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border border-blue-200">
                <Activity className="w-3.5 h-3.5" />
                Geographic Intelligence Dashboard
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
                Beneficiary Analytics Command Center
              </h1>
              <p className="text-slate-600 mt-3 max-w-3xl text-base md:text-lg leading-relaxed">
                Deep, category-wise beneficiary distribution analytics using real state/UT datasets from your local data repository.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500 bg-white/80 border border-slate-200 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Live from local dataset files · Real-time category composition
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              <StatPill icon={Users} label="Total Beneficiaries" value={formatNumber(totalBeneficiaries)} />
              <StatPill icon={Building2} label="States Covered" value={String(sortedDataset.length)} />
              <StatPill icon={TrendingUp} label="Top 5 Share" value={`${topFiveShare.toFixed(1)}%`} />
              <StatPill icon={MapIcon} label="Category" value={CATEGORY_CONFIG[activeCategory].label} />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.7)] p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3 text-slate-600 text-sm font-medium">
            <Filter className="w-4 h-4" />
            Category Views
          </div>
          <div className="flex flex-wrap gap-2 bg-slate-100/70 rounded-2xl p-2 border border-slate-200">
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveCategory(key)
                  setPinnedState('')
                  setHoveredState('')
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  activeCategory === key
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/30'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:shadow'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">{CATEGORY_CONFIG[activeCategory].description}</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/40 shadow-[0_16px_35px_-20px_rgba(15,23,42,0.9)] p-4 md:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <p className="text-sm font-semibold text-slate-700">Timeline Playback</p>
              </div>

              {availablePeriods.length ? (
                <>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying((prev) => !prev)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <p className="text-sm text-slate-600">
                      Period: <span className="font-semibold text-slate-900">{selectedPeriod}</span>
                    </p>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(availablePeriods.length - 1, 0)}
                    value={periodIndex}
                    onChange={(e) => {
                      setPeriodIndex(Number(e.target.value))
                      setIsPlaying(false)
                    }}
                    className="w-full mt-3 accent-indigo-600"
                  />
                  <div className="flex justify-between mt-1 text-xs text-slate-500">
                    <span>{availablePeriods[0]}</span>
                    <span>{availablePeriods[availablePeriods.length - 1]}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  This category has no period-wise records. Showing cumulative distribution.
                </p>
              )}
            </div>

            <div className="w-full lg:w-[420px]">
              <div className="flex items-center gap-2 mb-2">
                <GitCompare className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-semibold text-slate-700">Compare Mode</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCompareMode((prev) => !prev)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    compareMode ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {compareMode ? 'Comparison ON' : 'Enable Comparison'}
                </button>

                <select
                  value={compareCategory}
                  onChange={(e) => setCompareCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 bg-white"
                >
                  {Object.entries(CATEGORY_CONFIG)
                    .filter(([key]) => key !== 'all')
                    .map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                In compare mode, the map shows <span className="font-semibold text-emerald-700">green (higher)</span> and <span className="font-semibold text-red-700">red (lower)</span> versus selected comparison category.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/40 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.9)] p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-blue-600" />
                  India Heatmap
                </h2>
                <div className="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-3 py-1">
                  Click a state to pin · Hover to inspect
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-3 md:p-4">
                <ComposableMap
                  projectionConfig={{ scale: 980, center: [82.5, 23] }}
                  style={{ width: '100%', height: 'auto' }}
                >
                  <ZoomableGroup center={[82.5, 23]}>
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const geoState = extractGeoStateName(geo.properties)
                          const value = stateValueMap.get(geoState) || 0
                          const deltaValue = deltaStateMap.get(geoState) || 0
                          const fillColor = compareMode
                            ? getDeltaColor(deltaValue, maxAbsDelta)
                            : getHeatColor(value, minValue, maxValue)

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={fillColor}
                              stroke="#ffffff"
                              strokeWidth={0.8}
                              style={{
                                default: { outline: 'none', cursor: 'pointer' },
                                hover: { fill: '#F59E0B', outline: 'none', cursor: 'pointer' },
                                pressed: { fill: '#D97706', outline: 'none' }
                              }}
                              onMouseEnter={() => setHoveredState(geoState)}
                              onMouseLeave={() => setHoveredState('')}
                              onClick={() => setPinnedState((prev) => (prev === geoState ? '' : geoState))}
                            />
                          )
                        })
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  {compareMode ? 'Relative Delta Scale' : 'Beneficiary Intensity'}
                </p>
                <div className={`h-3 rounded ${compareMode
                  ? 'bg-gradient-to-r from-[#7F1D1D] via-[#FCA5A5] via-40% to-[#BBF7D0] to-[#14532D]'
                  : 'bg-gradient-to-r from-[#E5E7EB] via-[#93C5FD] to-[#1E3A8A]'
                }`} />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  {compareMode ? (
                    <>
                      <span>-{formatNumber(maxAbsDelta)}</span>
                      <span>+{formatNumber(maxAbsDelta)}</span>
                    </>
                  ) : (
                    <>
                      <span>{formatNumber(minValue)}</span>
                      <span>{formatNumber(maxValue)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/40 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.9)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-800">Trend / Comparative Distribution</h2>
              </div>

              {categoryTrend.length > 0 ? (
                <div className="space-y-3">
                  {categoryTrend.map((item) => {
                    const widthPct = trendMax > 0 ? (item.value / trendMax) * 100 : 0
                    return (
                      <div key={item.label} className="grid grid-cols-12 gap-3 items-center bg-slate-50/70 border border-slate-100 rounded-xl px-3 py-2.5">
                        <div className="col-span-3 text-sm text-slate-600 font-medium">{item.label}</div>
                        <div className="col-span-7 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-700" style={{ width: `${widthPct}%` }} />
                        </div>
                        <div className="col-span-2 text-sm text-right font-semibold text-slate-700">{formatNumber(item.value)}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  No year-wise records available for this category. Showing state distribution only.
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-4 space-y-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/40 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.9)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-800">State Focus</h3>
              </div>
              {activeStateData ? (
                <div className="space-y-3">
                  <p className="text-xl font-bold text-slate-900">{activeStateData.state}</p>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-blue-700">Beneficiaries</p>
                    <p className="text-2xl font-bold text-blue-900">{formatNumber(activeStateData.value)}</p>
                  </div>
                  {compareMode && (
                    <div className={`rounded-xl p-3 border ${activeStateDelta >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <p className={`text-xs ${activeStateDelta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        Delta vs {CATEGORY_CONFIG[compareCategory].label}
                      </p>
                      <p className={`text-xl font-bold ${activeStateDelta >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                        {activeStateDelta >= 0 ? '+' : ''}{formatNumber(activeStateDelta)}
                      </p>
                    </div>
                  )}
                  <div className="text-sm text-slate-600">
                    Share of selected category:{' '}
                    <span className="font-semibold text-slate-800">
                      {totalBeneficiaries > 0
                        ? `${((activeStateData.value / totalBeneficiaries) * 100).toFixed(2)}%`
                        : '0.00%'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Hover on map or click a state to view granular contribution and share.
                </p>
              )}
            </div>

            {compareMode && (
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/40 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.9)] p-5">
                <h3 className="font-semibold text-slate-800 mb-4">
                  Compare Insights ({CATEGORY_CONFIG[activeCategory].label} vs {CATEGORY_CONFIG[compareCategory].label})
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 mb-2">Top Gainers</p>
                    <div className="space-y-2">
                      {gainers.map((entry) => (
                        <button
                          key={`g_${entry.state}`}
                          onClick={() => setPinnedState(entry.state)}
                          className="w-full text-left text-xs rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2 hover:bg-emerald-100 transition"
                        >
                          <p className="font-semibold text-emerald-900 truncate">{entry.state}</p>
                          <p className="text-emerald-700">+{formatNumber(entry.delta)}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-2">Top Decliners</p>
                    <div className="space-y-2">
                      {decliners.map((entry) => (
                        <button
                          key={`d_${entry.state}`}
                          onClick={() => setPinnedState(entry.state)}
                          className="w-full text-left text-xs rounded-lg border border-red-100 bg-red-50 px-2.5 py-2 hover:bg-red-100 transition"
                        >
                          <p className="font-semibold text-red-900 truncate">{entry.state}</p>
                          <p className="text-red-700">{formatNumber(entry.delta)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/40 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.9)] p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Top Performing States</h3>
              <div className="space-y-2">
                {sortedDataset.slice(0, 8).map((entry, index) => (
                  <button
                    key={entry.state}
                    onClick={() => setPinnedState(entry.state)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-200 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5">{index + 1}</span>
                      <span className="text-sm text-slate-700">{entry.state}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-700">{formatNumber(entry.value)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/40 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.9)] p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Analytical Summary</h3>
              <div className="space-y-3 text-sm">
                <SummaryRow
                  icon={ArrowUpRight}
                  label="Highest"
                  value={sortedDataset[0] ? `${sortedDataset[0].state} (${formatNumber(sortedDataset[0].value)})` : '—'}
                  positive
                />
                <SummaryRow
                  icon={ArrowDownRight}
                  label="Lowest"
                  value={sortedDataset[sortedDataset.length - 1]
                    ? `${sortedDataset[sortedDataset.length - 1].state} (${formatNumber(sortedDataset[sortedDataset.length - 1].value)})`
                    : '—'}
                />
                <SummaryRow icon={Users} label="Mean per state" value={formatNumber(avgPerState)} />
                <SummaryRow
                  icon={TrendingUp}
                  label="Concentration"
                  value={`Top 5 states hold ${topFiveShare.toFixed(1)}%`}
                  positive
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/40 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.9)] p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">State Table (Ranked)</h2>
          <div className="overflow-auto max-h-[420px] border border-slate-200 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 z-10">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Rank</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">State / UT</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Beneficiaries</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Share</th>
                </tr>
              </thead>
              <tbody>
                {sortedDataset.map((entry, idx) => (
                  <tr
                    key={entry.state}
                    className="border-b border-slate-100 hover:bg-blue-50/40 transition cursor-pointer"
                    onClick={() => setPinnedState(entry.state)}
                  >
                    <td className="px-4 py-3 text-slate-500">#{idx + 1}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{entry.state}</td>
                    <td className="px-4 py-3 text-right text-slate-800 font-semibold">{formatNumber(entry.value)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {totalBeneficiaries > 0 ? `${((entry.value / totalBeneficiaries) * 100).toFixed(2)}%` : '0.00%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {pinnedState && (
          <>
            <div
              className="fixed inset-0 bg-slate-950/35 backdrop-blur-[1px] z-40"
              onClick={() => setPinnedState('')}
            />
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-[0_0_0_1px_rgba(148,163,184,0.2),-20px_0_40px_-16px_rgba(15,23,42,0.5)] p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500">State Drill-down</p>
                  <h3 className="text-2xl font-bold text-slate-900">{pinnedState}</h3>
                </div>
                <button
                  onClick={() => setPinnedState('')}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Selected Category</p>
                  <p className="text-lg font-bold text-slate-900">{CATEGORY_CONFIG[activeCategory].label}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Current Value</p>
                  <p className="text-lg font-bold text-slate-900">{formatNumber(activeStateData?.value || 0)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Trend Sparkline</p>
                  <p className="text-xs text-slate-500">{stateSeries.length} points</p>
                </div>
                {stateSeries.length ? (
                  <svg viewBox="0 0 280 90" className="w-full h-24">
                    <path
                      d={buildSparklinePath(stateSeries, 280, 90)}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <p className="text-sm text-slate-500">No trend available for selected view.</p>
                )}

                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>{stateSeries[0]?.label || '—'}</span>
                  <span>{stateSeries[stateSeries.length - 1]?.label || '—'}</span>
                </div>
              </div>

              {compareMode && (
                <div className="rounded-2xl border border-slate-200 p-4 mb-5">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Comparison vs {CATEGORY_CONFIG[compareCategory].label}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs text-emerald-700">Delta</p>
                      <p className={`text-lg font-bold ${activeStateDelta >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                        {activeStateDelta >= 0 ? '+' : ''}{formatNumber(activeStateDelta)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Compare Value</p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatNumber(compareStateValueMap.get(pinnedState) || 0)}
                      </p>
                    </div>
                  </div>

                  {compareSeries.length > 0 && (
                    <>
                      <p className="text-xs text-slate-500 mb-2">Comparison trend</p>
                      <svg viewBox="0 0 280 80" className="w-full h-20">
                        <path
                          d={buildSparklinePath(compareSeries, 280, 80)}
                          fill="none"
                          stroke="#0F766E"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Quick Facts</p>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    National share: <span className="font-semibold text-slate-900">
                      {totalBeneficiaries > 0 ? `${(((activeStateData?.value || 0) / totalBeneficiaries) * 100).toFixed(2)}%` : '0.00%'}
                    </span>
                  </p>
                  <p>
                    Current rank: <span className="font-semibold text-slate-900">
                      #{Math.max(sortedDataset.findIndex((entry) => entry.state === pinnedState) + 1, 0)}
                    </span>
                  </p>
                  <p>
                    Category: <span className="font-semibold text-slate-900">{CATEGORY_CONFIG[activeCategory].label}</span>
                  </p>
                  {selectedPeriod && (
                    <p>
                      Active period: <span className="font-semibold text-slate-900">{selectedPeriod}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="bg-white/85 border border-slate-200 rounded-2xl p-3 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-medium">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-slate-900 font-bold text-base md:text-lg truncate tracking-tight">{value}</p>
    </div>
  )
}

function SummaryRow({ icon: Icon, label, value, positive = false }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
      <Icon className={`w-4 h-4 mt-0.5 ${positive ? 'text-emerald-600' : 'text-slate-500'}`} />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-slate-700 font-medium leading-snug">{value}</p>
      </div>
    </div>
  )
}

export default GeographicalMap