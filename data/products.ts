import { Product } from '../types';

export const products: Product[] = [
  // Solar Solutions
  { id: '10001', productName: 'Monocrystalline Solar Panel', size: '400W', price: 18500, category: 'Solar Solutions', stock: 60, unit: 'panel' },
  { id: '10002', productName: 'Polycrystalline Solar Panel', size: '250W', price: 11200, category: 'Solar Solutions', stock: 80, unit: 'panel' },
  { id: '10003', productName: 'Solar Charge Controller', size: '60A MPPT', price: 9500, category: 'Solar Solutions', stock: 35, unit: 'unit' },
  { id: '10004', productName: 'Deep Cycle Solar Battery', size: '200Ah', price: 24000, category: 'Solar Solutions', stock: 40, unit: 'battery' },
  { id: '10005', productName: 'Solar Inverter', size: '5KVA Pure Sine Wave', price: 52000, category: 'Solar Solutions', stock: 18, unit: 'unit' },
  { id: '10006', productName: 'Solar Mounting Bracket Set', size: 'Roof', price: 3200, category: 'Solar Solutions', stock: 120, unit: 'set' },
  { id: '10007', productName: 'Solar DC Cable', size: '6mm²', price: 180, category: 'Solar Solutions', stock: 500, unit: 'metre' },
  { id: '10008', productName: 'Solar Street Light', size: '60W All-in-One', price: 14500, category: 'Solar Solutions', stock: 25, unit: 'unit' },

  // Electrical Installations
  { id: '10009', productName: 'MCB', size: '32A Double Pole', price: 850, category: 'Electrical Installations', stock: 200, unit: 'piece' },
  { id: '10010', productName: 'Consumer Unit', size: '8-Way', price: 4200, category: 'Electrical Installations', stock: 45, unit: 'unit' },
  { id: '10011', productName: 'Electrical Cable', size: '2.5mm²', price: 120, category: 'Electrical Installations', stock: 800, unit: 'metre' },
  { id: '10012', productName: 'Electrical Conduit Pipe', size: '20mm', price: 65, category: 'Electrical Installations', stock: 600, unit: 'metre' },
  { id: '10013', productName: 'Ceiling Rose with Holder', size: 'B22', price: 280, category: 'Electrical Installations', stock: 150, unit: 'piece' },
  { id: '10014', productName: 'Wall Socket', size: '13A Double', price: 450, category: 'Electrical Installations', stock: 180, unit: 'piece' },
  { id: '10015', productName: 'Earthing Rod Copper', size: '1.2m', price: 1200, category: 'Electrical Installations', stock: 60, unit: 'rod' },

  // Plumbing Services
  { id: '10016', productName: 'PVC Pipe', size: '1/2 inch', price: 95, category: 'Plumbing Services', stock: 700, unit: 'metre' },
  { id: '10017', productName: 'PPR Pipe', size: '3/4 inch', price: 140, category: 'Plumbing Services', stock: 400, unit: 'metre' },
  { id: '10018', productName: 'PVC Elbow', size: '90° 1/2 inch', price: 35, category: 'Plumbing Services', stock: 500, unit: 'piece' },
  { id: '10019', productName: 'Ball Valve Brass', size: '1/2 inch', price: 550, category: 'Plumbing Services', stock: 120, unit: 'piece' },
  { id: '10020', productName: 'PVC Solvent Cement', size: '500ml', price: 380, category: 'Plumbing Services', stock: 90, unit: 'tin' },
  { id: '10021', productName: 'Water Tap Mixer', size: 'Chrome', price: 2800, category: 'Plumbing Services', stock: 50, unit: 'piece' },
  { id: '10022', productName: 'Water Storage Tank', size: '1000L Vertical', price: 12500, category: 'Plumbing Services', stock: 15, unit: 'tank' },

  // Borehole Solutions
  { id: '10023', productName: 'Borehole Submersible Pump', size: '1.5HP', price: 45000, category: 'Borehole Solutions', stock: 12, unit: 'pump' },
  { id: '10024', productName: 'Borehole Pump Control Box', size: '1.5HP', price: 8500, category: 'Borehole Solutions', stock: 20, unit: 'unit' },
  { id: '10025', productName: 'Borehole Rising Main Pipe', size: '32mm', price: 420, category: 'Borehole Solutions', stock: 300, unit: 'metre' },
  { id: '10026', productName: 'Borehole Headworks Completion Kit', size: 'Standard', price: 18000, category: 'Borehole Solutions', stock: 8, unit: 'kit' },
  { id: '10027', productName: 'Borehole Water Level Sensor', size: '0-100m', price: 6500, category: 'Borehole Solutions', stock: 16, unit: 'unit' },
  { id: '10028', productName: 'Pressure Tank', size: '100L Vertical', price: 15000, category: 'Borehole Solutions', stock: 10, unit: 'unit' },

  // Irrigation Systems
  { id: '10029', productName: 'Drip Irrigation Tape', size: '16mm', price: 45, category: 'Irrigation Systems', stock: 2000, unit: 'metre' },
  { id: '10030', productName: 'PVC Irrigation Pipe', size: '50mm', price: 280, category: 'Irrigation Systems', stock: 500, unit: 'metre' },
  { id: '10031', productName: 'Irrigation Filter Screen', size: '1 inch', price: 1800, category: 'Irrigation Systems', stock: 60, unit: 'piece' },
  { id: '10032', productName: 'Sprinkler Head Impact', size: '3/4 inch', price: 1200, category: 'Irrigation Systems', stock: 80, unit: 'piece' },
  { id: '10033', productName: 'Irrigation Venturi Injector', size: '3/4 inch', price: 3500, category: 'Irrigation Systems', stock: 25, unit: 'piece' },
  { id: '10034', productName: 'Irrigation Controller', size: '4-Station', price: 8500, category: 'Irrigation Systems', stock: 18, unit: 'unit' },
  { id: '10035', productName: 'PVC Ball Valve', size: '50mm', price: 850, category: 'Irrigation Systems', stock: 100, unit: 'piece' },
  { id: '10036', productName: 'Drip Line Fittings Set', size: '50 pcs', price: 2200, category: 'Irrigation Systems', stock: 40, unit: 'set' },
];
