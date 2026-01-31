import { useState, useEffect } from 'react'
import { Map as MapIcon, TrendingUp, Info } from 'lucide-react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps'
import axios from 'axios'

// Mock data for scheme utilization by state
const MOCK_UTILIZATION_DATA = {
  'Andhra Pradesh': 45,
  'Arunachal Pradesh': 12,
  'Assam': 38,
  'Bihar': 67,
  'Chhattisgarh': 29,
  'Goa': 15,
  'Gujarat': 52,
  'Haryana': 34,
  'Himachal Pradesh': 18,
  'Jharkhand': 41,
  'Karnataka': 58,
  'Kerala': 63,
  'Madhya Pradesh': 55,
  'Maharashtra': 72,
  'Manipur': 8,
  'Meghalaya': 11,
  'Mizoram': 7,
  'Nagaland': 9,
  'Odisha': 48,
  'Punjab': 31,
  'Rajasthan': 59,
  'Sikkim': 6,
  'Tamil Nadu': 68,
  'Telangana': 44,
  'Tripura': 13,
  'Uttar Pradesh': 89,
  'Uttarakhand': 22,
  'West Bengal': 61,
  'Andaman and Nicobar Islands': 3,
  'Chandigarh': 5,
  'Dadra and Nagar Haveli': 2,
  'Daman and Diu': 2,
  'Delhi': 19,
  'Jammu and Kashmir': 16,
  'Ladakh': 4,
  'Lakshadweep': 1,
  'Puducherry': 4
}

// State name mapping for the map
const STATE_NAME_MAP = {
  'Andhra Pradesh': 'Andhra Pradesh',
  'Arunachal Pradesh': 'Arunachal Pradesh',
  'Assam': 'Assam',
  'Bihar': 'Bihar',
  'Chhattisgarh': 'Chhattisgarh',
  'Goa': 'Goa',
  'Gujarat': 'Gujarat',
  'Haryana': 'Haryana',
  'Himachal Pradesh': 'Himachal Pradesh',
  'Jharkhand': 'Jharkhand',
  'Karnataka': 'Karnataka',
  'Kerala': 'Kerala',
  'Madhya Pradesh': 'Madhya Pradesh',
  'Maharashtra': 'Maharashtra',
  'Manipur': 'Manipur',
  'Meghalaya': 'Meghalaya',
  'Mizoram': 'Mizoram',
  'Nagaland': 'Nagaland',
  'Odisha': 'Odisha',
  'Punjab': 'Punjab',
  'Rajasthan': 'Rajasthan',
  'Sikkim': 'Sikkim',
  'Tamil Nadu': 'Tamil Nadu',
  'Telangana': 'Telangana',
  'Tripura': 'Tripura',
  'Uttar Pradesh': 'Uttar Pradesh',
  'Uttarakhand': 'Uttarakhand',
  'West Bengal': 'West Bengal'
}

// India states GeoJSON URL
// Note: You may need to host your own GeoJSON file or use a CDN
// Alternative: Use a library like react-leaflet with OpenStreetMap
const geoUrl = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson'

function getColor(value) {
  if (value >= 70) return '#1e40af' // Dark blue - high
  if (value >= 50) return '#3b82f6' // Blue - medium-high
  if (value >= 30) return '#60a5fa' // Light blue - medium
  if (value >= 15) return '#93c5fd' // Lighter blue - low-medium
  return '#dbeafe' // Very light blue - low
}

function GeographicalMap() {
  const [utilizationData, setUtilizationData] = useState(MOCK_UTILIZATION_DATA)
  const [selectedState, setSelectedState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In the future, fetch from API
    // axios.get('/api/state-utilization').then(res => {
    //   setUtilizationData(res.data)
    //   setLoading(false)
    // })
    setTimeout(() => setLoading(false), 500)
  }, [])

  const maxUtilization = Math.max(...Object.values(utilizationData))
  const minUtilization = Math.min(...Object.values(utilizationData))

  return (
    <div className="min-h-screen bg-blue-50 p-4 py-8">
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <MapIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Scheme Utilization by State
          </h1>
          <p className="text-gray-600">
            Color-coded map showing number of schemes utilized in each state
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="card p-4">
              {loading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ComposableMap
                  projectionConfig={{
                    scale: 1000,
                    center: [82, 23]
                  }}
                  style={{ width: '100%', height: 'auto' }}
                >
                  <ZoomableGroup>
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const stateName = geo.properties.NAME_1 || geo.properties.name || geo.properties.NAME || ''
                          const utilization = utilizationData[stateName] || 0
                          const fillColor = getColor(utilization)

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={fillColor}
                              stroke="#fff"
                              strokeWidth={0.5}
                              style={{
                                default: {
                                  fill: fillColor,
                                  outline: 'none',
                                  cursor: 'pointer'
                                },
                                hover: {
                                  fill: '#fbbf24',
                                  outline: 'none',
                                  cursor: 'pointer'
                                },
                                pressed: {
                                  fill: '#f59e0b',
                                  outline: 'none'
                                }
                              }}
                              onMouseEnter={() => setSelectedState(stateName)}
                              onMouseLeave={() => setSelectedState(null)}
                            />
                          )
                        })
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>
              )}

              {/* Legend */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Utilization Scale</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-4 bg-gradient-to-r from-blue-50 via-blue-300 to-blue-900 rounded"></div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>Low ({minUtilization})</span>
                    <span>High ({maxUtilization})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {selectedState ? (
              <div className="card bg-gradient-to-br from-blue-50 to-purple-50">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {selectedState}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Schemes Utilized</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {utilizationData[selectedState] || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Hover over states</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Hover over any state on the map to see detailed utilization statistics.
                </p>
              </div>
            )}

            {/* Top States */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Top States</h3>
              <div className="space-y-2">
                {Object.entries(utilizationData)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([state, count], index) => (
                    <div
                      key={state}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedState(state)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 w-6">
                          {index + 1}.
                        </span>
                        <span className="text-sm text-gray-700">{state}</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default GeographicalMap
