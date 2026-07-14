
import { CommitteeMember } from './types';

export const COMMITTEE_MEMBERS: CommitteeMember[] = [
  { id: '1', name: 'H. Ahmad Syarifuddin', role: 'Ketua DKM', photo: 'https://picsum.photos/seed/chairman/200' },
  { id: '2', name: 'Ust. Ridwan Hakim', role: 'Sekretaris', photo: 'https://picsum.photos/seed/secretary/200' },
  { id: '3', name: 'Bpk. Yusuf Mansur', role: 'Bendahara', photo: 'https://picsum.photos/seed/treasurer/200' },
  { id: '4', name: 'Hj. Siti Aminah', role: 'Bidang Muslimah', photo: 'https://picsum.photos/seed/lady/200' },
  { id: '5', name: 'Bpk. Ali Imron', role: 'Bidang Pemuda/Remas', photo: 'https://picsum.photos/seed/youth/200' },
  { id: '6', name: 'Bpk. Lukman Hadi', role: 'Bidang Sarana Prasarana', photo: 'https://picsum.photos/seed/facility/200' },
];

export const INITIAL_TRANSACTIONS = [
  { id: 'tr1', date: '2024-05-10', activity: 'Infaq Jumat', amount: 2500000, type: 'IN', category: 'Infaq' },
  { id: 'tr2', date: '2024-05-12', activity: 'Bayar Listrik Mei', amount: 850000, type: 'OUT', category: 'Operasional' },
  { id: 'tr3', date: '2024-05-15', activity: 'Sodakoh Pembangunan', amount: 5000000, type: 'IN', category: 'Pembangunan' },
  { id: 'tr4', date: '2024-05-18', activity: 'Servis AC Masjid', amount: 450000, type: 'OUT', category: 'Pemeliharaan' },
] as const;
