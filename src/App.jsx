import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:3001/api/wokwi/status";

const initialSensorData = {
  temperature: 0,
  accelerationX: 0,
  accelerationY: 0,
  accelerationZ: 0,
  motion: 0,
  riskLevel: 0,
  riskName: "WAITING",
  message: "Waiting for Wokwi data",
};

const riskInfo = {
  0: {
    name: "STABLE",
    description: "Normal operating conditions",
    className: "stable",
  },
  1: {
    name: "MONITOR",
    description: "Conditions require monitoring",
    className: "monitor",
  },
  2: {
    name: "RECOVERY",
    description: "Abnormal movement detected",
    className: "recovery",
  },
  3: {
    name: "HIGH",
    description: "High-risk condition detected",
    className: "high",
  },
  4: {
    name: "ALERT",
    description: "Critical condition detected",
    className: "alert",
  },
};

const navigation = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "⌂",
  },
  {
    id: "monitor",
    label: "Live Monitoring",
    icon: "◉",
  },
  {
    id: "analytics",
    label: "Sensor Analytics",
    icon: "▥",
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: "⚠",
  },
  {
    id: "device",
    label: "Device Connection",
    icon: "⌁",
  },
];

function formatTime(date) {
  if (!date) {
    return "--:--:--";
  }

  return date.toLocaleTimeString();
}

function App() {
  const [page, setPage] = useState("dashboard");

  const [sensorData, setSensorData] =
    useState(initialSensorData);

  const [connected, setConnected] =
    useState(false);

  const [connecting, setConnecting] =
    useState(true);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [error, setError] =
    useState("");

  const [history, setHistory] =
    useState([]);

  const [alerts, setAlerts] =
    useState([]);

  const fetchWokwiData = useCallback(async () => {
    try {
      const response = await fetch(
        API_URL,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.connected) {
        throw new Error(
          data.error ||
            "Wokwi simulator is not connected."
        );
      }

      const now = new Date();

      setSensorData({
        temperature: Number(data.temperature) || 0,
        accelerationX:
          Number(data.accelerationX) || 0,
        accelerationY:
          Number(data.accelerationY) || 0,
        accelerationZ:
          Number(data.accelerationZ) || 0,
        motion: Number(data.motion) || 0,
        riskLevel:
          Number(data.riskLevel) || 0,
        riskName:
          data.riskName ||
          riskInfo[Number(data.riskLevel)]?.name ||
          "UNKNOWN",
        message:
          data.message ||
          "Automatic monitoring active",
      });

      setConnected(true);
      setConnecting(false);
      setError("");
      setLastUpdated(now);

      setHistory((previous) => {
        const next = [
          ...previous,
          {
            time: now,
            temperature:
              Number(data.temperature) || 0,
            motion:
              Number(data.motion) || 0,
            riskLevel:
              Number(data.riskLevel) || 0,
          },
        ];

        return next.slice(-60);
      });

      if (Number(data.riskLevel) >= 3) {
        setAlerts((previous) => {
          const lastAlert =
            previous[previous.length - 1];

          const sameRisk =
            lastAlert &&
            lastAlert.riskLevel ===
              Number(data.riskLevel);

          const tooRecent =
            lastAlert &&
            now.getTime() -
              lastAlert.time.getTime() <
              5000;

          if (sameRisk && tooRecent) {
            return previous;
          }

          return [
            ...previous,
            {
              id: `${now.getTime()}-${Math.random()}`,
              time: now,
              riskLevel:
                Number(data.riskLevel),
              name:
                data.riskName ||
                riskInfo[
                  Number(data.riskLevel)
                ]?.name,
              message:
                data.message ||
                "Risk condition detected",
              temperature:
                Number(data.temperature) || 0,
              motion:
                Number(data.motion) || 0,
            },
          ].slice(-30);
        });
      }
    } catch (requestError) {
      setConnected(false);
      setConnecting(false);
      setError(
        requestError.message ||
          "Unable to reach Wokwi."
      );
    }
  }, []);

  useEffect(() => {
    fetchWokwiData();

    const interval = setInterval(
      fetchWokwiData,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [fetchWokwiData]);

  const currentRisk =
    riskInfo[sensorData.riskLevel] ||
    riskInfo[0];

  const maximumTemperature = useMemo(() => {
    if (history.length === 0) {
      return 0;
    }

    return Math.max(
      ...history.map(
        (item) => item.temperature
      )
    );
  }, [history]);

  const maximumMotion = useMemo(() => {
    if (history.length === 0) {
      return 0;
    }

    return Math.max(
      ...history.map(
        (item) => item.motion
      )
    );
  }, [history]);

  const averageTemperature = useMemo(() => {
    if (history.length === 0) {
      return 0;
    }

    const total = history.reduce(
      (sum, item) =>
        sum + item.temperature,
      0
    );

    return total / history.length;
  }, [history]);

  const riskPercentage =
    (sensorData.riskLevel / 4) * 100;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            FG
          </div>

          <div>
            <div className="brand-title">
              FuelGuard
            </div>

            <div className="brand-subtitle">
              AI Safety System
            </div>
          </div>
        </div>

        <div className="connection-mini">
          <span
            className={
              connected
                ? "status-dot online"
                : "status-dot offline"
            }
          />

          <div>
            <strong>
              {connected
                ? "Wokwi Live"
                : "Disconnected"}
            </strong>

            <small>
              {connected
                ? "Automatic data stream"
                : "Waiting for simulator"}
            </small>
          </div>
        </div>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={
                page === item.id
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                setPage(item.id)
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="status-dot online" />

            <div>
              <small>Monitoring Mode</small>
              <strong>Automatic</strong>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>
              {navigation.find(
                (item) => item.id === page
              )?.label}
            </h1>

            <p>
              Intelligent Safety Monitoring System
            </p>
          </div>

          <div className="topbar-actions">
            <div
              className={
                connected
                  ? "live-badge connected"
                  : "live-badge disconnected"
              }
            >
              <span className="status-dot" />

              {connected
                ? "WOKWI LIVE"
                : "WOKWI OFFLINE"}
            </div>

            <button
              className="refresh-button"
              onClick={fetchWokwiData}
            >
              ↻ Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="connection-warning">
            <div>
              <strong>
                Wokwi data connection unavailable
              </strong>

              <span>
                {error}
              </span>
            </div>

            <button
              onClick={fetchWokwiData}
            >
              Retry
            </button>
          </div>
        )}

        {page === "dashboard" && (
          <DashboardPage
            sensorData={sensorData}
            currentRisk={currentRisk}
            riskPercentage={riskPercentage}
            connected={connected}
            lastUpdated={lastUpdated}
            history={history}
            alerts={alerts}
            onNavigate={setPage}
          />
        )}

        {page === "monitor" && (
          <MonitorPage
            sensorData={sensorData}
            currentRisk={currentRisk}
            connected={connected}
            lastUpdated={lastUpdated}
            history={history}
          />
        )}

        {page === "analytics" && (
          <AnalyticsPage
            sensorData={sensorData}
            history={history}
            maximumTemperature={
              maximumTemperature
            }
            maximumMotion={maximumMotion}
            averageTemperature={
              averageTemperature
            }
          />
        )}

        {page === "alerts" && (
          <AlertsPage
            alerts={alerts}
            sensorData={sensorData}
          />
        )}

        {page === "device" && (
          <DevicePage
            connected={connected}
            connecting={connecting}
            lastUpdated={lastUpdated}
            onReconnect={fetchWokwiData}
          />
        )}
      </main>
    </div>
  );
}

// =====================================================
// DASHBOARD
// =====================================================

function DashboardPage({
  sensorData,
  currentRisk,
  riskPercentage,
  connected,
  lastUpdated,
  history,
  alerts,
  onNavigate,
}) {
  return (
    <div className="page-content">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">
            AUTOMATIC RISK MONITORING
          </span>

          <h2>
            FuelGuard AI
          </h2>

          <p>
            Live sensor intelligence from the
            simulated ESP32 device.
          </p>

          <div className="hero-status">
            <span
              className={
                connected
                  ? "status-dot online"
                  : "status-dot offline"
              }
            />

            <span>
              {connected
                ? "Receiving automatic Wokwi data"
                : "Waiting for Wokwi connection"}
            </span>
          </div>
        </div>

        <div className="hero-risk">
          <span>
            CURRENT RISK
          </span>

          <strong>
            {sensorData.riskLevel}
            <small>/4</small>
          </strong>

          <label className={currentRisk.className}>
            {currentRisk.name}
          </label>
        </div>
      </section>

      <section className="section-heading">
        <div>
          <h2>Current Risk</h2>

          <p>
            Automatically calculated from
            sensor conditions.
          </p>
        </div>

        <span className="last-update">
          Updated{" "}
          {formatTime(lastUpdated)}
        </span>
      </section>

      <section className="risk-panel">
        <div className="risk-main">
          <div
            className={`risk-circle ${currentRisk.className}`}
          >
            <strong>
              {sensorData.riskLevel}
            </strong>

            <span>
              /4
            </span>
          </div>

          <div>
            <div
              className={`risk-title ${currentRisk.className}`}
            >
              {currentRisk.name}
            </div>

            <p>
              {currentRisk.description}
            </p>

            <div className="risk-progress">
              <div
                className={`progress-fill ${currentRisk.className}`}
                style={{
                  width: `${Math.max(
                    riskPercentage,
                    3
                  )}%`,
                }}
              />
            </div>

            <div className="risk-scale">
              <span>Stable</span>
              <span>Monitor</span>
              <span>Recovery</span>
              <span>High</span>
              <span>Alert</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-heading">
        <div>
          <h2>Live Sensors</h2>

          <p>
            Direct values received from Wokwi.
          </p>
        </div>
      </section>

      <SensorGrid
        sensorData={sensorData}
      />

      <section className="quick-grid">
        <button
          className="quick-card"
          onClick={() =>
            onNavigate("monitor")
          }
        >
          <span className="quick-icon">
            ◉
          </span>

          <div>
            <strong>
              Live Monitoring
            </strong>

            <small>
              View live sensor stream
            </small>
          </div>

          <span>→</span>
        </button>

        <button
          className="quick-card"
          onClick={() =>
            onNavigate("analytics")
          }
        >
          <span className="quick-icon">
            ▥
          </span>

          <div>
            <strong>
              Sensor Analytics
            </strong>

            <small>
              Review recent measurements
            </small>
          </div>

          <span>→</span>
        </button>

        <button
          className="quick-card"
          onClick={() =>
            onNavigate("alerts")
          }
        >
          <span className="quick-icon">
            ⚠
          </span>

          <div>
            <strong>
              Alert History
            </strong>

            <small>
              {alerts.length} recorded alerts
            </small>
          </div>

          <span>→</span>
        </button>

        <div className="quick-card readonly">
          <span className="quick-icon">
            ⟳
          </span>

          <div>
            <strong>
              Automatic Updates
            </strong>

            <small>
              {history.length} data points
            </small>
          </div>

          <span className="pulse">
            LIVE
          </span>
        </div>
      </section>
    </div>
  );
}

// =====================================================
// SENSOR GRID
// =====================================================

function SensorGrid({ sensorData }) {
  const sensors = [
    {
      title: "Temperature",
      value: sensorData.temperature.toFixed(1),
      unit: "°C",
      icon: "T",
    },
    {
      title: "Acceleration X",
      value:
        sensorData.accelerationX.toFixed(2),
      unit: "m/s²",
      icon: "X",
    },
    {
      title: "Acceleration Y",
      value:
        sensorData.accelerationY.toFixed(2),
      unit: "m/s²",
      icon: "Y",
    },
    {
      title: "Acceleration Z",
      value:
        sensorData.accelerationZ.toFixed(2),
      unit: "m/s²",
      icon: "Z",
    },
    {
      title: "Motion",
      value:
        sensorData.motion.toFixed(2),
      unit: "m/s²",
      icon: "M",
    },
  ];

  return (
    <div className="sensor-grid">
      {sensors.map((sensor) => (
        <div
          className="sensor-card"
          key={sensor.title}
        >
          <div className="sensor-card-top">
            <span className="sensor-icon">
              {sensor.icon}
            </span>

            <span className="sensor-live">
              LIVE
            </span>
          </div>

          <span className="sensor-name">
            {sensor.title}
          </span>

          <div className="sensor-value">
            <strong>
              {sensor.value}
            </strong>

            <span>
              {sensor.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// LIVE MONITOR
// =====================================================

function MonitorPage({
  sensorData,
  currentRisk,
  connected,
  lastUpdated,
  history,
}) {
  return (
    <div className="page-content">
      <section className="monitor-header">
        <div>
          <span className="eyebrow">
            REAL-TIME SENSOR STREAM
          </span>

          <h2>
            Live Monitoring
          </h2>

          <p>
            The dashboard is receiving sensor
            data automatically every second.
          </p>
        </div>

        <div
          className={
            connected
              ? "large-live-status online"
              : "large-live-status offline"
          }
        >
          <span className="status-dot" />

          {connected
            ? "CONNECTED"
            : "DISCONNECTED"}
        </div>
      </section>

      <section className="monitor-grid">
        <div className="monitor-risk-card">
          <span>
            CURRENT RISK
          </span>

          <div
            className={`big-risk ${currentRisk.className}`}
          >
            {sensorData.riskLevel}
          </div>

          <strong
            className={currentRisk.className}
          >
            {currentRisk.name}
          </strong>

          <p>
            {sensorData.message}
          </p>
        </div>

        <div className="monitor-data-card">
          <h3>
            Live Sensor Values
          </h3>

          <div className="data-list">
            <DataRow
              label="Temperature"
              value={`${sensorData.temperature.toFixed(
                2
              )} °C`}
            />

            <DataRow
              label="Acceleration X"
              value={`${sensorData.accelerationX.toFixed(
                2
              )} m/s²`}
            />

            <DataRow
              label="Acceleration Y"
              value={`${sensorData.accelerationY.toFixed(
                2
              )} m/s²`}
            />

            <DataRow
              label="Acceleration Z"
              value={`${sensorData.accelerationZ.toFixed(
                2
              )} m/s²`}
            />

            <DataRow
              label="Motion"
              value={`${sensorData.motion.toFixed(
                2
              )} m/s²`}
            />

            <DataRow
              label="Last update"
              value={formatTime(
                lastUpdated
              )}
            />
          </div>
        </div>
      </section>

      <section className="chart-card">
        <div className="chart-header">
          <div>
            <h3>
              Recent Sensor Stream
            </h3>

            <p>
              Last {history.length} readings
            </p>
          </div>

          <span className="stream-indicator">
            ● LIVE
          </span>
        </div>

        <SimpleChart
          history={history}
        />
      </section>
    </div>
  );
}

// =====================================================
// ANALYTICS
// =====================================================

function AnalyticsPage({
  sensorData,
  history,
  maximumTemperature,
  maximumMotion,
  averageTemperature,
}) {
  return (
    <div className="page-content">
      <section className="page-intro">
        <span className="eyebrow">
          SENSOR DATA ANALYSIS
        </span>

        <h2>
          Sensor Analytics
        </h2>

        <p>
          Automatic measurements collected from
          the Wokwi ESP32 simulation.
        </p>
      </section>

      <section className="analytics-stats">
        <StatCard
          title="Average Temperature"
          value={`${averageTemperature.toFixed(
            1
          )} °C`}
          description="Recent readings"
        />

        <StatCard
          title="Maximum Temperature"
          value={`${maximumTemperature.toFixed(
            1
          )} °C`}
          description="Recent readings"
        />

        <StatCard
          title="Maximum Motion"
          value={`${maximumMotion.toFixed(
            2
          )} m/s²`}
          description="Recent readings"
        />

        <StatCard
          title="Current Risk"
          value={`${sensorData.riskLevel}/4`}
          description={sensorData.riskName}
        />
      </section>

      <section className="chart-card">
        <div className="chart-header">
          <div>
            <h3>
              Temperature History
            </h3>

            <p>
              Automatic Wokwi sensor data
            </p>
          </div>
        </div>

        <TemperatureChart
          history={history}
        />
      </section>

      <section className="chart-card">
        <div className="chart-header">
          <div>
            <h3>
              Motion History
            </h3>

            <p>
              Gravity-corrected motion value
            </p>
          </div>
        </div>

        <MotionChart
          history={history}
        />
      </section>
    </div>
  );
}

// =====================================================
// ALERTS
// =====================================================

function AlertsPage({
  alerts,
  sensorData,
}) {
  return (
    <div className="page-content">
      <section className="page-intro">
        <span className="eyebrow">
          AUTOMATIC EVENT DETECTION
        </span>

        <h2>
          Alerts
        </h2>

        <p>
          Alerts are created automatically when
          the ESP32 reports a high or critical
          risk level.
        </p>
      </section>

      <div className="current-alert-banner">
        <div>
          <span>
            CURRENT DEVICE STATUS
          </span>

          <strong>
            {sensorData.riskName}
          </strong>

          <p>
            {sensorData.message}
          </p>
        </div>

        <div
          className={`alert-number ${riskInfo[
            sensorData.riskLevel
          ]?.className}`}
        >
          {sensorData.riskLevel}
        </div>
      </div>

      <section className="alerts-card">
        <div className="chart-header">
          <div>
            <h3>
              Alert History
            </h3>

            <p>
              Automatically generated events
            </p>
          </div>

          <span>
            {alerts.length} events
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              ✓
            </div>

            <h3>
              No alerts recorded
            </h3>

            <p>
              The automatic monitoring system
              has not detected a high-risk
              condition.
            </p>
          </div>
        ) : (
          <div className="alert-list">
            {[...alerts]
              .reverse()
              .map((alert) => (
                <div
                  className="alert-row"
                  key={alert.id}
                >
                  <div
                    className={`alert-level ${riskInfo[
                      alert.riskLevel
                    ]?.className}`}
                  >
                    {alert.riskLevel}
                  </div>

                  <div className="alert-details">
                    <strong>
                      {alert.name}
                    </strong>

                    <span>
                      {alert.message}
                    </span>

                    <small>
                      Temperature:{" "}
                      {alert.temperature.toFixed(
                        1
                      )}
                      °C · Motion:{" "}
                      {alert.motion.toFixed(2)}
                      m/s²
                    </small>
                  </div>

                  <time>
                    {formatTime(
                      alert.time
                    )}
                  </time>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

// =====================================================
// DEVICE
// =====================================================

function DevicePage({
  connected,
  connecting,
  lastUpdated,
  onReconnect,
}) {
  return (
    <div className="page-content">
      <section className="page-intro">
        <span className="eyebrow">
          DEVICE COMMUNICATION
        </span>

        <h2>
          Device Connection
        </h2>

        <p>
          FuelGuard is configured to receive
          live data from the Wokwi ESP32 through
          the local HTTP gateway.
        </p>
      </section>

      <section className="device-card">
        <div className="device-visual">
          <div className="device-chip">
            ESP32
          </div>
        </div>

        <div className="device-details">
          <div className="device-title-row">
            <div>
              <span>
                SIMULATED DEVICE
              </span>

              <h3>
                FuelGuard-ESP32
              </h3>
            </div>

            <div
              className={
                connected
                  ? "device-status online"
                  : "device-status offline"
              }
            >
              <span className="status-dot" />

              {connected
                ? "Connected"
                : "Disconnected"}
            </div>
          </div>

          <div className="device-info-grid">
            <DataRow
              label="Connection"
              value="Wokwi WiFi"
            />

            <DataRow
              label="Protocol"
              value="HTTP / JSON"
            />

            <DataRow
              label="Endpoint"
              value="/api/status"
            />

            <DataRow
              label="Update rate"
              value="1 second"
            />

            <DataRow
              label="Last data"
              value={formatTime(
                lastUpdated
              )}
            />

            <DataRow
              label="Monitoring"
              value="Automatic"
            />
          </div>

          <button
            className="primary-button"
            onClick={onReconnect}
          >
            {connecting
              ? "Connecting..."
              : "Reconnect Wokwi"}
          </button>
        </div>
      </section>

      <section className="setup-card">
        <h3>
          Connection Architecture
        </h3>

        <div className="setup-flow">
          <div>
            <strong>
              01
            </strong>

            <span>
              Wokwi
            </span>

            <small>
              Simulated sensors
            </small>
          </div>

          <span className="flow-arrow">
            →
          </span>

          <div>
            <strong>
              02
            </strong>

            <span>
              ESP32
            </span>

            <small>
              HTTP /api/status
            </small>
          </div>

          <span className="flow-arrow">
            →
          </span>

          <div>
            <strong>
              03
            </strong>

            <span>
              Node Server
            </span>

            <small>
              Port 3001
            </small>
          </div>

          <span className="flow-arrow">
            →
          </span>

          <div>
            <strong>
              04
            </strong>

            <span>
              React
            </span>

            <small>
              Live dashboard
            </small>
          </div>
        </div>
      </section>
    </div>
  );
}

// =====================================================
// DATA ROW
// =====================================================

function DataRow({ label, value }) {
  return (
    <div className="data-row">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  title,
  value,
  description,
}) {
  return (
    <div className="stat-card">
      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>
    </div>
  );
}

// =====================================================
// SIMPLE CHART
// =====================================================

function SimpleChart({ history }) {
  if (history.length < 2) {
    return (
      <div className="chart-empty">
        Waiting for more sensor data...
      </div>
    );
  }

  const width = 900;
  const height = 260;

  const values = history.map(
    (item) => item.motion
  );

  const maxValue =
    Math.max(...values, 1);

  const points = history
    .map((item, index) => {
      const x =
        (index /
          Math.max(history.length - 1, 1)) *
        width;

      const y =
        height -
        (item.motion / maxValue) *
          (height - 30) -
        10;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="svg-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1={height - 10}
          x2={width}
          y2={height - 10}
          stroke="rgba(255,255,255,.1)"
        />

        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// =====================================================
// TEMPERATURE CHART
// =====================================================

function TemperatureChart({ history }) {
  if (history.length < 2) {
    return (
      <div className="chart-empty">
        Waiting for temperature data...
      </div>
    );
  }

  const width = 900;
  const height = 260;

  const values = history.map(
    (item) => item.temperature
  );

  const minValue =
    Math.min(...values) - 1;

  const maxValue =
    Math.max(...values, minValue + 1) + 1;

  const range =
    maxValue - minValue;

  const points = history
    .map((item, index) => {
      const x =
        (index /
          Math.max(history.length - 1, 1)) *
        width;

      const normalized =
        (item.temperature -
          minValue) /
        range;

      const y =
        height -
        normalized *
          (height - 30) -
        10;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="svg-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// =====================================================
// MOTION CHART
// =====================================================

function MotionChart({ history }) {
  if (history.length < 2) {
    return (
      <div className="chart-empty">
        Waiting for motion data...
      </div>
    );
  }

  const width = 900;
  const height = 260;

  const values = history.map(
    (item) => item.motion
  );

  const maxValue =
    Math.max(...values, 1);

  const points = history
    .map((item, index) => {
      const x =
        (index /
          Math.max(history.length - 1, 1)) *
        width;

      const y =
        height -
        (item.motion / maxValue) *
          (height - 30) -
        10;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="svg-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default App;