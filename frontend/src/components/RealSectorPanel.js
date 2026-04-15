import React, { useEffect, useState } from 'react';
import { Factory, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import axios from 'axios';
import LSMDataModal from './LSMDataModal';
import AutoVehiclesModal from './AutoVehiclesModal';
import TwoThreeWheelersModal from './TwoThreeWheelersModal';
import FertilizerModal from './FertilizerModal';
import PolSalesModal from './PolSalesModal';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const RealSectorPanel = ({ loading: parentLoading }) => {
  const [lsmData, setLsmData] = useState(null);
  const [autoVehiclesData, setAutoVehiclesData] = useState(null);
  const [fertilizerData, setFertilizerData] = useState(null);
  const [polSalesData, setPolSalesData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [isTwoThreeModalOpen, setIsTwoThreeModalOpen] = useState(false);
  const [isFertilizerModalOpen, setIsFertilizerModalOpen] = useState(false);
  const [isPolModalOpen, setIsPolModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lsmRes, lsmHistRes, autoVehiclesRes, fertilizerRes, polSalesRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/lsm`),
          axios.get(`${API_BASE}/api/lsm-historical`),
          axios.get(`${API_BASE}/api/auto-vehicles`),
          axios.get(`${API_BASE}/api/fertilizer`),
          axios.get(`${API_BASE}/api/pol-sales`)
        ]);

        if (lsmRes.status === 'fulfilled') {
          setLsmData(lsmRes.value.data.data);
        }

        if (lsmHistRes.status === 'fulfilled' && lsmHistRes.value.data.data) {
          setLsmData((prev) => ({
            ...prev,
            ...lsmHistRes.value.data.data,
            latest: prev?.latest || lsmHistRes.value.data.data.latest
          }));
        }

        if (autoVehiclesRes.status === 'fulfilled') {
          const payload = autoVehiclesRes.value.data;
          if (payload?.data) {
            setAutoVehiclesData({
              ...payload.data,
              stale: payload.stale,
              updated: payload.updated || payload.data.updated
            });
          }
        }

        if (fertilizerRes.status === 'fulfilled') {
          setFertilizerData(fertilizerRes.value.data.data);
        }

        if (polSalesRes.status === 'fulfilled') {
          const payload = polSalesRes.value.data;
          if (payload?.data) {
            setPolSalesData({
              ...payload.data,
              stale: payload.stale,
              updated: payload.updated || payload.data.updated
            });
          }
        }
      } catch (error) {
        console.error('Error fetching LSM data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  if (parentLoading || dataLoading) {
    return (
      <div className="panel" data-testid="real-sector-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Factory size={16} />
            Real Sector
          </div>
        </div>
        <div className="panel-content">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  const latestValue = lsmData?.latest?.value;
  const latestMonth = lsmData?.latest?.month || '';
  const momChangePct = lsmData?.mom_change_pct;

  const autoMonth = autoVehiclesData?.latest_month || '';
  const productionLatest = autoVehiclesData?.production?.latest?.total;
  const salesLatest = autoVehiclesData?.sales?.latest?.total;
  const productionChange = autoVehiclesData?.production?.mom_change_pct;
  const salesChange = autoVehiclesData?.sales?.mom_change_pct;

  const prodTwoThreeHist = autoVehiclesData?.production?.history || [];
  const salesTwoThreeHist = autoVehiclesData?.sales?.history || [];
  const prodTwoThreeLatest = prodTwoThreeHist.length ? prodTwoThreeHist[prodTwoThreeHist.length - 1]?.two_three_wheelers : null;
  const prodTwoThreePrev = prodTwoThreeHist.length > 1 ? prodTwoThreeHist[prodTwoThreeHist.length - 2]?.two_three_wheelers : null;
  const salesTwoThreeLatest = salesTwoThreeHist.length ? salesTwoThreeHist[salesTwoThreeHist.length - 1]?.two_three_wheelers : null;
  const salesTwoThreePrev = salesTwoThreeHist.length > 1 ? salesTwoThreeHist[salesTwoThreeHist.length - 2]?.two_three_wheelers : null;

  const prodTwoThreeChange = (prodTwoThreePrev && prodTwoThreePrev !== 0)
    ? ((prodTwoThreeLatest - prodTwoThreePrev) / prodTwoThreePrev) * 100
    : null;
  const salesTwoThreeChange = (salesTwoThreePrev && salesTwoThreePrev !== 0)
    ? ((salesTwoThreeLatest - salesTwoThreePrev) / salesTwoThreePrev) * 100
    : null;

  const twoThreeModalData = {
    source: autoVehiclesData?.source,
    updated: autoVehiclesData?.updated,
    stale: autoVehiclesData?.stale,
    latest_month: autoVehiclesData?.latest_month,
    production: {
      latest: {
        total: prodTwoThreeLatest,
        month: autoVehiclesData?.production?.latest?.month,
        date: autoVehiclesData?.production?.latest?.date
      },
      mom_change_pct: prodTwoThreeChange,
      history: prodTwoThreeHist.map((item) => ({ date: item.date, total: item.two_three_wheelers || 0 }))
    },
    sales: {
      latest: {
        total: salesTwoThreeLatest,
        month: autoVehiclesData?.sales?.latest?.month,
        date: autoVehiclesData?.sales?.latest?.date
      },
      mom_change_pct: salesTwoThreeChange,
      history: salesTwoThreeHist.map((item) => ({ date: item.date, total: item.two_three_wheelers || 0 }))
    }
  };

  const fertilizerLatest = fertilizerData?.latest?.total;
  const fertilizerChange = fertilizerData?.mom_change_pct;
  const fertilizerMonth = fertilizerData?.latest?.month || '';

  const polLatest = polSalesData?.latest?.total;
  const polChange = polSalesData?.mom_change_pct;
  const polMonth = polSalesData?.latest?.month || '';

  const formatCount = (val) => {
    if (val === null || val === undefined) return '--';
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return Number(val).toFixed(0);
  };

  return (
    <div className="panel" data-testid="real-sector-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Factory size={16} />
          Real Sector
        </div>
        <span className="panel-badge">LIVE</span>
      </div>
      <div className="panel-content">
        <div className="economic-grid" data-testid="real-sector-grid">
          <div
            className="economic-item clickable"
            data-testid="real-sector-item-lsm"
            onClick={() => setIsModalOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="economic-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>LSM Quantum Index</span>
              <ExternalLink size={10} style={{ opacity: 0.6 }} />
              <span
                className="live-dot"
                data-testid="real-sector-lsm-live-dot"
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#22C55E',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite'
                }}
              ></span>
            </div>
            <div className="economic-value" data-testid="real-sector-lsm-value">
                {latestValue !== null && latestValue !== undefined ? Number(latestValue).toFixed(2) : '--'}
            </div>
            {momChangePct !== null && momChangePct !== undefined && (
              <div className={`economic-change ${momChangePct >= 0 ? 'positive' : 'negative'}`} data-testid="real-sector-lsm-change">
                {momChangePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {momChangePct >= 0 ? '+' : ''}{momChangePct.toFixed(2)}%
              </div>
            )}
            <div className="economic-sublabel" data-testid="real-sector-lsm-month">{latestMonth}</div>
            <div className="economic-label" style={{ marginTop: '0.15rem' }}>
              Quantum Index of Large-scale Manufacturing
            </div>
          </div>

          <div
            className="economic-item clickable"
            data-testid="real-sector-item-auto"
            onClick={() => setIsAutoModalOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="economic-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Auto Vehicles</span>
              <ExternalLink size={10} style={{ opacity: 0.6 }} />
              <span
                className="live-dot"
                data-testid="real-sector-auto-live-dot"
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: autoVehiclesData?.stale ? '#F59E0B' : '#22C55E',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite'
                }}
              ></span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
              <div>
                <div className="economic-sublabel" style={{ marginBottom: '0.08rem' }}>Production</div>
                <div className="economic-value" style={{ fontSize: '1.2rem' }} data-testid="real-sector-auto-production-value">
                  {formatCount(productionLatest)}
                </div>
              </div>
              {productionChange !== null && productionChange !== undefined && (
                <div className={`economic-change ${productionChange >= 0 ? 'positive' : 'negative'}`} data-testid="real-sector-auto-production-change">
                  {productionChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {productionChange >= 0 ? '+' : ''}{productionChange.toFixed(2)}%
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.3rem' }}>
              <div>
                <div className="economic-sublabel" style={{ marginBottom: '0.08rem' }}>Sales</div>
                <div className="economic-value" style={{ fontSize: '1.2rem' }} data-testid="real-sector-auto-sales-value">
                  {formatCount(salesLatest)}
                </div>
              </div>
              {salesChange !== null && salesChange !== undefined && (
                <div className={`economic-change ${salesChange >= 0 ? 'positive' : 'negative'}`} data-testid="real-sector-auto-sales-change">
                  {salesChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {salesChange >= 0 ? '+' : ''}{salesChange.toFixed(2)}%
                </div>
              )}
            </div>

            <div className="economic-sublabel" style={{ marginTop: '0.3rem' }} data-testid="real-sector-auto-month">{autoMonth}</div>
          </div>

          <div
            className="economic-item clickable"
            data-testid="real-sector-item-two-three"
            onClick={() => setIsTwoThreeModalOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="economic-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>2/3 Wheelers</span>
              <ExternalLink size={10} style={{ opacity: 0.6 }} />
              <span
                className="live-dot"
                data-testid="real-sector-two-three-live-dot"
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: autoVehiclesData?.stale ? '#F59E0B' : '#22C55E',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite'
                }}
              ></span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
              <div>
                <div className="economic-sublabel" style={{ marginBottom: '0.08rem' }}>Production</div>
                <div className="economic-value" style={{ fontSize: '1.1rem' }} data-testid="real-sector-two-three-production-value">
                  {formatCount(prodTwoThreeLatest)}
                </div>
              </div>
              {prodTwoThreeChange !== null && prodTwoThreeChange !== undefined && (
                <div className={`economic-change ${prodTwoThreeChange >= 0 ? 'positive' : 'negative'}`} data-testid="real-sector-two-three-production-change">
                  {prodTwoThreeChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {prodTwoThreeChange >= 0 ? '+' : ''}{prodTwoThreeChange.toFixed(2)}%
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.3rem' }}>
              <div>
                <div className="economic-sublabel" style={{ marginBottom: '0.08rem' }}>Sales</div>
                <div className="economic-value" style={{ fontSize: '1.1rem' }} data-testid="real-sector-two-three-sales-value">
                  {formatCount(salesTwoThreeLatest)}
                </div>
              </div>
              {salesTwoThreeChange !== null && salesTwoThreeChange !== undefined && (
                <div className={`economic-change ${salesTwoThreeChange >= 0 ? 'positive' : 'negative'}`} data-testid="real-sector-two-three-sales-change">
                  {salesTwoThreeChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {salesTwoThreeChange >= 0 ? '+' : ''}{salesTwoThreeChange.toFixed(2)}%
                </div>
              )}
            </div>

            <div className="economic-sublabel" style={{ marginTop: '0.3rem' }} data-testid="real-sector-two-three-month">{autoMonth}</div>
          </div>

          <div
            className="economic-item clickable"
            data-testid="real-sector-item-fertilizer"
            onClick={() => setIsFertilizerModalOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="economic-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Fertilizer</span>
              <ExternalLink size={10} style={{ opacity: 0.6 }} />
              <span
                className="live-dot"
                data-testid="real-sector-fertilizer-live-dot"
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#22C55E',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite'
                }}
              ></span>
            </div>

            <div className="economic-value" data-testid="real-sector-fertilizer-value">
              {formatCount(fertilizerLatest)}
            </div>

            {fertilizerChange !== null && fertilizerChange !== undefined && (
              <div className={`economic-change ${fertilizerChange >= 0 ? 'positive' : 'negative'}`} data-testid="real-sector-fertilizer-change">
                {fertilizerChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {fertilizerChange >= 0 ? '+' : ''}{fertilizerChange.toFixed(2)}%
              </div>
            )}

            <div className="economic-sublabel" data-testid="real-sector-fertilizer-month">{fertilizerMonth}</div>
            <div className="economic-label" style={{ marginTop: '0.15rem' }}>
              Total Sales/Offtake
            </div>
            <div className="economic-sublabel" data-testid="real-sector-fertilizer-unit" style={{ marginTop: '0.12rem' }}>
              Thousand Metric Ton
            </div>
          </div>

          <div
            className="economic-item clickable"
            data-testid="real-sector-item-pol"
            onClick={() => setIsPolModalOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="economic-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>POL Sales</span>
              <ExternalLink size={10} style={{ opacity: 0.6 }} />
              <span
                className="live-dot"
                data-testid="real-sector-pol-live-dot"
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: polSalesData?.stale ? '#F59E0B' : '#22C55E',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite'
                }}
              ></span>
            </div>

            <div className="economic-value" data-testid="real-sector-pol-value">
              {formatCount(polLatest)}
            </div>

            {polChange !== null && polChange !== undefined && (
              <div className={`economic-change ${polChange >= 0 ? 'positive' : 'negative'}`} data-testid="real-sector-pol-change">
                {polChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {polChange >= 0 ? '+' : ''}{polChange.toFixed(2)}%
              </div>
            )}

            <div className="economic-sublabel" data-testid="real-sector-pol-month">{polMonth}</div>
            <div className="economic-label" style={{ marginTop: '0.15rem' }}>
              Total POL Sales
            </div>
            <div className="economic-sublabel" data-testid="real-sector-pol-unit" style={{ marginTop: '0.12rem' }}>
              Metric Ton
            </div>
          </div>
        </div>
      </div>

      <LSMDataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={lsmData}
        title="Quantum Index of Large-scale Manufacturing"
      />

      <AutoVehiclesModal
        isOpen={isAutoModalOpen}
        onClose={() => setIsAutoModalOpen(false)}
        data={autoVehiclesData}
        title="Production and Sale of Auto Vehicles"
      />

      <TwoThreeWheelersModal
        isOpen={isTwoThreeModalOpen}
        onClose={() => setIsTwoThreeModalOpen(false)}
        data={twoThreeModalData}
        title="2/3 Wheelers"
      />

      <FertilizerModal
        isOpen={isFertilizerModalOpen}
        onClose={() => setIsFertilizerModalOpen(false)}
        data={fertilizerData}
        title="Fertilizer Sales/Offtake"
      />

      <PolSalesModal
        isOpen={isPolModalOpen}
        onClose={() => setIsPolModalOpen(false)}
        data={polSalesData}
        title="POL Sales"
      />
    </div>
  );
};

export default RealSectorPanel;