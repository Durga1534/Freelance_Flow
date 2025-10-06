interface CommonItem {
  id: string;
  description: string;
  rate: number;
  category: string;
}

export const COMMON_ITEMS: CommonItem[] = [
  {
    id: 'consulting-hour',
    description: 'Consulting Services (per hour)',
    rate: 150,
    category: 'Consulting',
  },
  {
    id: 'development-hour',
    description: 'Development Services (per hour)',
    rate: 200,
    category: 'Development',
  },
  {
    id: 'design-hour',
    description: 'Design Services (per hour)',
    rate: 175,
    category: 'Design',
  },
  {
    id: 'project-management',
    description: 'Project Management (per hour)',
    rate: 125,
    category: 'Management',
  },
  {
    id: 'maintenance-monthly',
    description: 'Monthly Maintenance Package',
    rate: 500,
    category: 'Maintenance',
  },
];

export const getItemsByCategory = (category: string) => {
  return COMMON_ITEMS.filter(item => item.category === category);
};

export const findItemById = (id: string) => {
  return COMMON_ITEMS.find(item => item.id === id);
};