import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import {
  financialsData,
  FINANCIAL_CATEGORIES,
  FINANCIAL_YEARS,
  CATEGORY_CHART_COLORS,
  FinancialItem,
} from '../data/financials';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme';

// ─── constants ───────────────────────────────────────────────────────────────
const SCREEN_W = Dimensions.get('window').width;
const CHART_W   = SCREEN_W - 32;
const DATA_CATEGORIES = FINANCIAL_CATEGORIES.filter(c => c !== 'All');

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return '€' + n.toLocaleString('en-US');
}

function fmtK(s: string): string {
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  return n >= 1000 ? '€' + (n / 1000).toFixed(0) + 'k' : '€' + n.toFixed(0);
}

// ─── badge colours ───────────────────────────────────────────────────────────
const BADGE_LIGHT: Record<string, { bg: string; text: string }> = {
  Infrastructure: { bg: '#E3F2FD', text: '#1565C0' },
  Education:      { bg: '#F3E5F5', text: '#7B1FA2' },
  Healthcare:     { bg: '#E8F5E9', text: '#2E7D32' },
  Environment:    { bg: '#E0F7FA', text: '#00695C' },
  Administration: { bg: '#FFF8E1', text: '#F57F17' },
};
const BADGE_DARK: Record<string, { bg: string; text: string }> = {
  Infrastructure: { bg: '#152238', text: '#7EB8FF' },
  Education:      { bg: '#2A1535', text: '#CE93D8' },
  Healthcare:     { bg: '#1B3325', text: '#69C77A' },
  Environment:    { bg: '#0D2B2E', text: '#4DB6AC' },
  Administration: { bg: '#332A0D', text: '#FFD54F' },
};

// ─── CategoryBadge ───────────────────────────────────────────────────────────
function CategoryBadge({ category, isDark }: { category: string; isDark: boolean }) {
  const c = (isDark ? BADGE_DARK : BADGE_LIGHT)[category] ?? { bg: '#EEE', text: '#555' };
  return (
    <View style={[badgeS.badge, { backgroundColor: c.bg }]}>
      <Text style={[badgeS.text, { color: c.text }]}>{category}</Text>
    </View>
  );
}
const badgeS = StyleSheet.create({
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  text:  { fontSize: 11, fontWeight: '700' },
});

// ─── FinancialCard ───────────────────────────────────────────────────────────
function FinancialCard({ item, theme, isDark }: { item: FinancialItem; theme: Theme; isDark: boolean }) {
  return (
    <View style={[cardS.card, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
      <View style={cardS.topRow}>
        <CategoryBadge category={item.category} isDark={isDark} />
        <View style={cardS.rightCol}>
          <Text style={[cardS.total, { color: theme.accent }]}>{fmt(item.totalPrice)}</Text>
          <Text style={[cardS.year, { color: theme.textTertiary }]}>{item.year}</Text>
        </View>
      </View>
      <Text style={[cardS.name, { color: theme.textPrimary }]}>{item.name}</Text>
      <View style={[cardS.priceRow, { borderTopColor: theme.separator }]}>
        {[
          { label: 'Unit Price', val: fmt(item.itemPrice) },
          { label: 'Quantity',   val: `× ${item.quantity}` },
          { label: 'Total',      val: fmt(item.totalPrice), bold: true },
        ].map((col, i, arr) => (
          <React.Fragment key={col.label}>
            <View style={cardS.priceCol}>
              <Text style={[cardS.priceLabel, { color: theme.textTertiary }]}>{col.label}</Text>
              <Text style={[cardS.priceVal, { color: theme.textSecondary, fontWeight: col.bold ? '700' : '600' }]}>{col.val}</Text>
            </View>
            {i < arr.length - 1 && <View style={[cardS.divider, { backgroundColor: theme.separator }]} />}
          </React.Fragment>
        ))}
      </View>
      {item.notes ? <Text style={[cardS.notes, { color: theme.textTertiary }]}>{item.notes}</Text> : null}
    </View>
  );
}
const cardS = StyleSheet.create({
  card:       { borderRadius: 14, padding: 14, marginBottom: 12, shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 8 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rightCol:   { alignItems: 'flex-end', gap: 2 },
  total:      { fontSize: 17, fontWeight: '800' },
  year:       { fontSize: 11 },
  name:       { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  priceRow:   { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10 },
  priceCol:   { flex: 1, alignItems: 'center', gap: 2 },
  divider:    { width: 1, marginVertical: 2 },
  priceLabel: { fontSize: 11 },
  priceVal:   { fontSize: 13 },
  notes:      { fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
});

// ─── SummaryBar ──────────────────────────────────────────────────────────────
function SummaryBar({ items, theme }: { items: FinancialItem[]; theme: Theme }) {
  const total = useMemo(() => items.reduce((s, i) => s + i.totalPrice, 0), [items]);
  return (
    <View style={[sumS.bar, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={sumS.col}>
        <Text style={[sumS.label, { color: theme.textTertiary }]}>Items</Text>
        <Text style={[sumS.val, { color: theme.textPrimary }]}>{items.length}</Text>
      </View>
      <View style={[sumS.sep, { backgroundColor: theme.separator }]} />
      <View style={sumS.col}>
        <Text style={[sumS.label, { color: theme.textTertiary }]}>Total Budget</Text>
        <Text style={[sumS.val, { color: theme.accent, fontWeight: '800' }]}>{fmt(total)}</Text>
      </View>
    </View>
  );
}
const sumS = StyleSheet.create({
  bar:   { flexDirection: 'row', borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 12 },
  col:   { flex: 1, alignItems: 'center', gap: 2 },
  sep:   { width: 1, marginVertical: 4 },
  label: { fontSize: 12 },
  val:   { fontSize: 18, fontWeight: '700' },
});

// ─── ChartCard wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, theme }: { title: string; subtitle?: string; children: React.ReactNode; theme: Theme }) {
  return (
    <View style={[chartCardS.card, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
      <Text style={[chartCardS.title, { color: theme.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[chartCardS.sub, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}
const chartCardS = StyleSheet.create({
  card:  { borderRadius: 16, padding: 16, marginBottom: 14, shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  sub:   { fontSize: 12, marginBottom: 10 },
});

// ─── Legend row ──────────────────────────────────────────────────────────────
function Legend({ entries, theme }: { entries: { name: string; color: string; value: number }[]; theme: Theme }) {
  return (
    <View style={legS.wrap}>
      {entries.map(e => (
        <View key={e.name} style={legS.row}>
          <View style={[legS.dot, { backgroundColor: e.color }]} />
          <Text style={[legS.name, { color: theme.textSecondary }]}>{e.name}</Text>
          <Text style={[legS.val, { color: theme.textPrimary }]}>{fmt(e.value)}</Text>
        </View>
      ))}
    </View>
  );
}
const legS = StyleSheet.create({
  wrap: { marginTop: 12, gap: 6 },
  row:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:  { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, fontSize: 12 },
  val:  { fontSize: 12, fontWeight: '700' },
});

// ─── chart config factory ────────────────────────────────────────────────────
function makeChartConfig(theme: Theme, isDark: boolean) {
  return {
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => (isDark ? `rgba(126,184,255,${opacity})` : `rgba(26,26,46,${opacity})`),
    labelColor: () => theme.textSecondary,
    propsForDots: { r: '3', strokeWidth: '1', stroke: theme.accent },
    propsForBackgroundLines: { stroke: 'transparent' },
  };
}

// ─── Pie Chart section ───────────────────────────────────────────────────────
function PieSection({ items, theme, isDark }: { items: FinancialItem[]; theme: Theme; isDark: boolean }) {
  const { data, legendEntries } = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const item of items) {
      totals[item.category] = (totals[item.category] ?? 0) + item.totalPrice;
    }
    const data = DATA_CATEGORIES
      .filter(cat => (totals[cat] ?? 0) > 0)
      .map(cat => ({
        name: cat,
        population: totals[cat],
        color: CATEGORY_CHART_COLORS[cat] ?? '#999',
        legendFontColor: isDark ? '#9AA2B8' : '#555555',
        legendFontSize: 11,
      }));
    const legendEntries = data.map(d => ({ name: d.name, color: d.color, value: d.population }));
    return { data, legendEntries };
  }, [items, isDark]);

  if (data.length === 0) return null;

  return (
    <ChartCard title="Expense Distribution" subtitle="By category" theme={theme}>
      <PieChart
        data={data}
        width={CHART_W - 32}
        height={180}
        chartConfig={makeChartConfig(theme, isDark)}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="10"
        hasLegend={false}
        absolute
      />
      <Legend entries={legendEntries} theme={theme} />
    </ChartCard>
  );
}

// ─── Line chart – total over time ────────────────────────────────────────────
function LineTotal({ items, theme, isDark }: { items: FinancialItem[]; theme: Theme; isDark: boolean }) {
  const { labels, dataset } = useMemo(() => {
    const totals = FINANCIAL_YEARS.map(y =>
      items.filter(i => i.year === y).reduce((s, i) => s + i.totalPrice, 0)
    );
    return { labels: FINANCIAL_YEARS.map(String), dataset: totals };
  }, [items]);

  if (dataset.every(v => v === 0)) return null;

  return (
    <ChartCard title="Total Spending Over Time" subtitle="All categories combined" theme={theme}>
      <LineChart
        data={{ labels, datasets: [{ data: dataset, color: () => theme.accent, strokeWidth: 2 }] }}
        width={CHART_W - 32}
        height={180}
        chartConfig={makeChartConfig(theme, isDark)}
        bezier
        style={{ borderRadius: 10, marginLeft: -12 }}
        formatYLabel={fmtK}
        withDots
        withInnerLines={false}
        withOuterLines={false}
      />
    </ChartCard>
  );
}

// ─── Line chart – per category ───────────────────────────────────────────────
function LinePerCategory({ items, theme, isDark }: { items: FinancialItem[]; theme: Theme; isDark: boolean }) {
  const { labels, datasets, legendEntries } = useMemo(() => {
    const activeCategories = DATA_CATEGORIES.filter(cat =>
      FINANCIAL_YEARS.some(y => items.some(i => i.category === cat && i.year === y))
    );
    const datasets = activeCategories.map(cat => ({
      data: FINANCIAL_YEARS.map(y =>
        items.filter(i => i.category === cat && i.year === y).reduce((s, i) => s + i.totalPrice, 0)
      ),
      color: () => CATEGORY_CHART_COLORS[cat] ?? '#999',
      strokeWidth: 2,
    }));
    const legendEntries = activeCategories.map(cat => ({
      name: cat,
      color: CATEGORY_CHART_COLORS[cat] ?? '#999',
      value: items.filter(i => i.category === cat).reduce((s, i) => s + i.totalPrice, 0),
    }));
    return { labels: FINANCIAL_YEARS.map(String), datasets, legendEntries };
  }, [items]);

  if (datasets.length === 0) return null;

  return (
    <ChartCard title="Spending by Category" subtitle="Trend per category over years" theme={theme}>
      <LineChart
        data={{ labels, datasets }}
        width={CHART_W - 32}
        height={200}
        chartConfig={makeChartConfig(theme, isDark)}
        bezier
        style={{ borderRadius: 10, marginLeft: -12 }}
        formatYLabel={fmtK}
        withDots={false}
        withInnerLines={false}
        withOuterLines={false}
      />
      <Legend entries={legendEntries} theme={theme} />
    </ChartCard>
  );
}

// ─── Chip ────────────────────────────────────────────────────────────────────
function Chip({ label, active, onPress, theme }: { label: string; active: boolean; onPress: () => void; theme: Theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[chipS.chip, { backgroundColor: active ? theme.accent : theme.inputBg, borderColor: active ? theme.accent : theme.border }]}
    >
      <Text style={[chipS.text, { color: active ? theme.buttonText : theme.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const chipS = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: 13, fontWeight: '600' },
});

// ─── FiltersPanel ─────────────────────────────────────────────────────────────
interface FiltersState {
  category: string;
  year: number | null;
  search: string;
}

function FiltersPanel({
  filters, onChange, theme,
}: { filters: FiltersState; onChange: (f: FiltersState) => void; theme: Theme }) {
  const hasActive = filters.category !== 'All' || filters.year !== null || filters.search !== '';

  return (
    <View style={[filterS.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Search */}
      <View style={[filterS.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
        <Text style={[filterS.searchIcon, { color: theme.textTertiary }]}>🔍</Text>
        <TextInput
          style={[filterS.input, { color: theme.inputText }]}
          placeholder="Search by name…"
          placeholderTextColor={theme.placeholderText}
          value={filters.search}
          onChangeText={t => onChange({ ...filters, search: t })}
          returnKeyType="search"
        />
        {filters.search !== '' && (
          <TouchableOpacity onPress={() => onChange({ ...filters, search: '' })}>
            <Text style={[filterS.clearBtn, { color: theme.textTertiary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category */}
      <Text style={[filterS.sectionLabel, { color: theme.textTertiary }]}>CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterS.chipRow}>
        {FINANCIAL_CATEGORIES.map(cat => (
          <Chip key={cat} label={cat} active={filters.category === cat}
            onPress={() => onChange({ ...filters, category: cat })} theme={theme} />
        ))}
      </ScrollView>

      {/* Year */}
      <Text style={[filterS.sectionLabel, { color: theme.textTertiary }]}>YEAR</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterS.chipRow}>
        {FINANCIAL_YEARS.map(y => (
          <Chip key={y} label={String(y)} active={filters.year === y}
            onPress={() => onChange({ ...filters, year: filters.year === y ? null : y })} theme={theme} />
        ))}
      </ScrollView>

      {/* Reset */}
      {hasActive && (
        <TouchableOpacity
          onPress={() => onChange({ category: 'All', year: null, search: '' })}
          style={[filterS.resetBtn, { borderColor: theme.destructive }]}
        >
          <Text style={[filterS.resetText, { color: theme.destructive }]}>Reset Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const filterS = StyleSheet.create({
  panel:        { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14, gap: 8 },
  searchRow:    { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  searchIcon:   { fontSize: 14 },
  input:        { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearBtn:     { fontSize: 14, paddingHorizontal: 4 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  chipRow:      { gap: 8, paddingTop: 2 },
  resetBtn:     { borderWidth: 1, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 16, alignSelf: 'flex-start', marginTop: 4 },
  resetText:    { fontSize: 13, fontWeight: '700' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function FinancialsScreen() {
  const { theme, isDark } = useTheme();
  const [filters, setFilters] = useState<FiltersState>({ category: 'All', year: null, search: '' });

  // Cards respect all 3 filters
  const filtered = useMemo(() => {
    let data = financialsData;
    if (filters.category !== 'All') data = data.filter(i => i.category === filters.category);
    if (filters.year !== null)       data = data.filter(i => i.year === filters.year);
    if (filters.search.trim())       data = data.filter(i => i.name.toLowerCase().includes(filters.search.toLowerCase()));
    return data;
  }, [filters]);

  // Charts only use category + year (search doesn't affect charts)
  const chartData = useMemo(() => {
    let data = financialsData;
    if (filters.category !== 'All') data = data.filter(i => i.category === filters.category);
    if (filters.year !== null)       data = data.filter(i => i.year === filters.year);
    return data;
  }, [filters.category, filters.year]);

  const handleFilters = useCallback((f: FiltersState) => setFilters(f), []);
  const s = makeStyles(theme);

  const ListHeader = useMemo(() => (
    <View style={s.headerWrap}>
      <View style={s.titleRow}>
        <Text style={[s.pageTitle, { color: theme.textPrimary }]}>Municipal Financials</Text>
        <Text style={[s.pageSub, { color: theme.textSecondary }]}>Budget Overview</Text>
      </View>

      <FiltersPanel filters={filters} onChange={handleFilters} theme={theme} />

      <SummaryBar items={filtered} theme={theme} />

      {/* Charts only meaningful across multiple years */}
      {filters.year === null && (
        <>
          <PieSection items={chartData} theme={theme} isDark={isDark} />
          <LineTotal items={chartData} theme={theme} isDark={isDark} />
          {filters.category === 'All' && (
            <LinePerCategory items={chartData} theme={theme} isDark={isDark} />
          )}
        </>
      )}

      <Text style={[s.sectionLabel, { color: theme.textTertiary }]}>
        {filtered.length} ITEM{filtered.length !== 1 ? 'S' : ''}
      </Text>
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [filters, filtered, chartData, theme, isDark]);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.background }}
      data={filtered}
      keyExtractor={i => i.id}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={ListHeader}
      renderItem={({ item }) => <FinancialCard item={item} theme={theme} isDark={isDark} />}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={[s.emptyText, { color: theme.textTertiary }]}>No items match the current filters.</Text>
        </View>
      }
    />
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    headerWrap:   { paddingHorizontal: 16 },
    titleRow:     { paddingTop: 16, paddingBottom: 10, gap: 2 },
    pageTitle:    { fontSize: 20, fontWeight: '800' },
    pageSub:      { fontSize: 13 },
    sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
    list:         { paddingHorizontal: 16, paddingBottom: 32 },
    empty:        { paddingVertical: 40, alignItems: 'center' },
    emptyText:    { fontSize: 14 },
  });
}
