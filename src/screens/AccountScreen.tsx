import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme';
import VetoButton from '../components/VetoButton';
import FullScreenAlertOverlay from '../components/FullScreenAlertOverlay';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const ALL_SKILLS = [
  'Communication', 'Nursing', 'Administration', 'Data Entry',
  'Customer Support', 'Logistics', 'Healthcare Assistance',
  'Sales', 'Project Coordination', 'Laboratory Handling',
];
const MAX_DOCTORS = 3;

// ─── Small helpers ────────────────────────────────────────────────────────────
function SectionHeader({ title, theme }: { title: string; theme: Theme }) {
  return <Text style={[sh.sectionTitle, { color: theme.textTertiary }]}>{title}</Text>;
}

function Card({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return <View style={[sh.card, { backgroundColor: theme.surface }]}>{children}</View>;
}

function Sep({ theme }: { theme: Theme }) {
  return <View style={[sh.sep, { backgroundColor: theme.separator }]} />;
}

function FieldLabel({ label, theme }: { label: string; theme: Theme }) {
  return <Text style={[sh.fieldLabel, { color: theme.textTertiary }]}>{label}</Text>;
}

function Input({
  value, onChangeText, placeholder, keyboardType = 'default', theme, autoCapitalize = 'sentences',
}: {
  value: string; onChangeText: (t: string) => void; placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  theme: Theme; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <TextInput
      style={[sh.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.placeholderText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
    />
  );
}

function GenderPicker({ value, onChange, theme }: { value: string; onChange: (g: string) => void; theme: Theme }) {
  return (
    <View style={sh.chipRow}>
      {GENDERS.map((g) => (
        <TouchableOpacity
          key={g}
          style={[sh.chip, { backgroundColor: value === g ? theme.buttonBg : theme.inputBg, borderColor: value === g ? theme.accent : theme.inputBorder }]}
          onPress={() => onChange(g)}
          activeOpacity={0.75}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: value === g ? theme.buttonText : theme.textSecondary }}>{g}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SkillSelector({ selected, onToggle, theme }: { selected: string[]; onToggle: (s: string) => void; theme: Theme }) {
  return (
    <View style={sh.chipRow}>
      {ALL_SKILLS.map((skill) => {
        const on = selected.includes(skill);
        return (
          <TouchableOpacity
            key={skill}
            style={[sh.chip, { backgroundColor: on ? theme.buttonBg : theme.inputBg, borderColor: on ? theme.accent : theme.inputBorder }]}
            onPress={() => onToggle(skill)}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: on ? theme.buttonText : theme.textSecondary }}>
              {on ? '\u2713 ' : ''}{skill}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DoctorEntry({ doctor, index, onUpdate, onRemove, theme }: {
  doctor: Doctor; index: number;
  onUpdate: (id: string, field: keyof Doctor, value: string) => void;
  onRemove: (id: string) => void; theme: Theme;
}) {
  return (
    <View style={[sh.doctorCard, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
      <View style={sh.doctorRow}>
        <Text style={[sh.doctorIdx, { color: theme.textPrimary }]}>Doctor {index + 1}</Text>
        <TouchableOpacity onPress={() => onRemove(doctor.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.destructive }}>Remove</Text>
        </TouchableOpacity>
      </View>
      <Input value={doctor.name} onChangeText={(v) => onUpdate(doctor.id, 'name', v)} placeholder="Doctor name" theme={theme} autoCapitalize="words" />
      <View style={{ height: 8 }} />
      <Input value={doctor.specialty} onChangeText={(v) => onUpdate(doctor.id, 'specialty', v)} placeholder="Specialty (e.g. Cardiologist)" theme={theme} autoCapitalize="words" />
      <View style={{ height: 8 }} />
      <Input value={doctor.phone} onChangeText={(v) => onUpdate(doctor.id, 'phone', v)} placeholder="Phone number" keyboardType="phone-pad" theme={theme} autoCapitalize="none" />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AccountScreen() {
  const { theme } = useTheme();

  // Identity
  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');

  // Personal Info
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [height, setHeight] = useState('');

  // Career
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Doctors
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Veto state
  const [vetoActive, setVetoActive] = useState(false);
  const [vetoVisible, setVetoVisible] = useState(false);

  const toggleSkill = (skill: string) =>
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );

  const addDoctor = () => {
    if (doctors.length >= MAX_DOCTORS) {
      Alert.alert('Limit reached', 'You can add up to 3 personal doctors.');
      return;
    }
    setDoctors((prev) => [...prev, { id: Date.now().toString(), name: '', specialty: '', phone: '' }]);
  };

  const updateDoctor = (id: string, field: keyof Doctor, value: string) =>
    setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));

  const removeDoctor = (id: string) =>
    setDoctors((prev) => prev.filter((d) => d.id !== id));

  const handlePickCV = () => {
    Alert.alert('Upload CV', 'In the full app this opens a PDF picker.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Simulate Upload', onPress: () => setCvFileName('my_cv_2025.pdf') },
    ]);
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Identity ── */}
        <SectionHeader title="Identity" theme={theme} />
        <Card theme={theme}>
          <View style={sh.fieldBlock}>
            <FieldLabel label="Full Name" theme={theme} />
            <Input value={fullName} onChangeText={setFullName} placeholder="e.g. Eleni Papadopoulou" theme={theme} autoCapitalize="words" />
          </View>
          <Sep theme={theme} />
          <View style={sh.fieldBlock}>
            <FieldLabel label="ID Number" theme={theme} />
            <Input value={userId} onChangeText={setUserId} placeholder="e.g. ΑΒ 123456" theme={theme} autoCapitalize="characters" />
          </View>
          <Sep theme={theme} />
          <View style={sh.fieldBlock}>
            <FieldLabel label="Email Address" theme={theme} />
            <Input value={email} onChangeText={setEmail} placeholder="e.g. name@example.com" keyboardType="email-address" theme={theme} autoCapitalize="none" />
          </View>
        </Card>

        {/* ── Personal Info ── */}
        <SectionHeader title="Personal Info" theme={theme} />
        <Card theme={theme}>
          <View style={sh.fieldBlock}>
            <FieldLabel label="Gender" theme={theme} />
            <GenderPicker value={gender} onChange={setGender} theme={theme} />
          </View>
          <Sep theme={theme} />
          <View style={sh.fieldBlock}>
            <FieldLabel label="Birth Date (DD/MM/YYYY)" theme={theme} />
            <Input value={birthDate} onChangeText={setBirthDate} placeholder="e.g. 15/04/1985" theme={theme} />
          </View>
          <Sep theme={theme} />
          <View style={sh.fieldBlock}>
            <FieldLabel label="Height (cm)" theme={theme} />
            <Input value={height} onChangeText={setHeight} placeholder="e.g. 175" keyboardType="numeric" theme={theme} />
          </View>
        </Card>

        {/* ── Career ── */}
        <SectionHeader title="Career" theme={theme} />
        <Card theme={theme}>
          <View style={sh.fieldBlock}>
            <FieldLabel label="CV / Resume (PDF)" theme={theme} />
            <TouchableOpacity
              style={[sh.uploadBtn, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
              onPress={handlePickCV}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18, color: theme.textTertiary }}>{'📎'}</Text>
              <Text style={{ fontSize: 14, color: cvFileName ? theme.textPrimary : theme.placeholderText }}>
                {cvFileName ?? 'Tap to upload PDF'}
              </Text>
            </TouchableOpacity>
          </View>
          <Sep theme={theme} />
          <View style={sh.fieldBlock}>
            <FieldLabel label="Job Skills (select all that apply)" theme={theme} />
            <SkillSelector selected={selectedSkills} onToggle={toggleSkill} theme={theme} />
            {selectedSkills.length > 0 && (
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.accent, marginTop: 10 }}>
                {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
              </Text>
            )}
          </View>
        </Card>

        {/* ── Personal Doctors ── */}
        <SectionHeader title="Personal Doctors" theme={theme} />
        <Card theme={theme}>
          <View style={sh.fieldBlock}>
            {doctors.map((doc, idx) => (
              <View key={doc.id}>
                <DoctorEntry doctor={doc} index={idx} onUpdate={updateDoctor} onRemove={removeDoctor} theme={theme} />
                {idx < doctors.length - 1 && <View style={{ height: 12 }} />}
              </View>
            ))}
            {doctors.length < MAX_DOCTORS && (
              <TouchableOpacity
                style={[sh.addDoctorBtn, { borderColor: theme.accent }]}
                onPress={addDoctor}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.accent }}>
                  + Add Doctor ({doctors.length}/{MAX_DOCTORS})
                </Text>
              </TouchableOpacity>
            )}
            {doctors.length === MAX_DOCTORS && (
              <Text style={{ fontSize: 13, color: theme.textTertiary, textAlign: 'center', marginTop: 8 }}>
                Maximum of {MAX_DOCTORS} doctors reached.
              </Text>
            )}
          </View>
        </Card>

        {/* ── VETO ── */}
        <SectionHeader title="Official Actions" theme={theme} />
        <Card theme={theme}>
          <View style={sh.fieldBlock}>
            <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19, marginBottom: 4 }}>
              Use the VETO button to officially protest a decision by the local government.{'\n'}
              This action is logged and forwarded to the relevant authorities.
            </Text>
            <VetoButton
              isActive={vetoActive}
              onPress={() => {
                if (vetoActive) {
                  // Reversing: deactivate immediately
                  setVetoActive(false);
                } else {
                  // Activating: show overlay, mark active when it dismisses
                  setVetoVisible(true);
                }
              }}
            />
          </View>
        </Card>

        <Text style={{ fontSize: 12, color: theme.textTertiary, textAlign: 'center', marginBottom: 40 }}>
          Your account data is stored locally on your device.
        </Text>
      </ScrollView>

      {/* Full-screen VETO animation */}
      <FullScreenAlertOverlay
        visible={vetoVisible}
        onDismiss={() => {
          setVetoVisible(false);
          setVetoActive(true); // mark active after animation completes
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
});

const sh = StyleSheet.create({
  sectionTitle: {
    fontSize: 12, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 8, marginLeft: 4, marginTop: 8,
  },
  card: {
    borderRadius: 14, overflow: 'hidden', marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sep: { height: 1, marginHorizontal: 16 },
  fieldBlock: { padding: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 15,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  uploadBtn: {
    borderWidth: 1, borderRadius: 10, borderStyle: 'dashed',
    paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  doctorCard: { borderWidth: 1, borderRadius: 10, padding: 12 },
  doctorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  doctorIdx: { fontSize: 14, fontWeight: '700' },
  addDoctorBtn: {
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4,
  },
});
