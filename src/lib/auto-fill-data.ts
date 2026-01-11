/**
 * Auto-fill Test Data Generator for Onboarding Forms
 * Development mode utility to speed up manual testing
 */

// Sample companies for exporter onboarding
const sampleCompanies = [
  { name: 'PT Sinar Jaya Export', country: 'Indonesia', businessType: 'Manufacturing' },
  { name: 'Global Trade Solutions', country: 'Singapore', businessType: 'Commodities' },
  { name: 'European Import Hub GmbH', country: 'Malaysia', businessType: 'Electronics' },
  { name: 'Asia Pacific Trading Co', country: 'Thailand', businessType: 'Agriculture' },
  { name: 'Premium Export Partners', country: 'Vietnam', businessType: 'Textiles' },
  { name: 'Canadian Distribution Ltd', country: 'Philippines', businessType: 'Manufacturing' },
  { name: 'Nordic Trade Solutions AS', country: 'Indonesia', businessType: 'Commodities' },
  { name: 'Australian Trade Corp', country: 'Singapore', businessType: 'Others' }
]

// Sample investor names (individuals and companies)
const sampleInvestors = [
  { name: 'John Anderson', type: 'Individual' },
  { name: 'Sarah Mitchell Capital', type: 'Family Office' },
  { name: 'Global Ventures Fund', type: 'Venture Capital' },
  { name: 'Michael Chen', type: 'Individual' },
  { name: 'Dragon Asset Management', type: 'Asset Manager' },
  { name: 'Lisa Thompson', type: 'Individual' },
  { name: 'Pacific Treasury Group', type: 'Corporate Treasury' },
  { name: 'Robert Williams', type: 'Individual' },
  { name: 'Apex Investment Partners', type: 'Venture Capital' },
  { name: 'Emma Davis', type: 'Individual' }
]

// Sample addresses by country
const sampleAddresses = [
  { address: 'Jl. Sudirman No. 123, Jakarta 12190', country: 'Indonesia' },
  { address: '45 Marina Boulevard, Singapore 018987', country: 'Singapore' },
  { address: '789 Sukhumvit Road, Bangkok 10110', country: 'Thailand' },
  { address: '23 Jalan Ampang, Kuala Lumpur 50450', country: 'Malaysia' },
  { address: '12 Nguyen Hue Street, District 1, Ho Chi Minh City', country: 'Vietnam' },
  { address: '456 Ayala Avenue, Makati City 1226', country: 'Philippines' },
  { address: '789 Market Street, San Francisco, CA 94103', country: 'United States' },
  { address: '123 Oxford Street, London W1D 2HG', country: 'United Kingdom' }
]

// Generate random tax ID (generic 15-digit format)
const generateTaxId = () => {
  const digits = Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0')
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}.${digits.slice(8, 9)}-${digits.slice(9, 12)}.${digits.slice(12, 15)}`
}

// Generate random export license number
const generateExportLicense = (country: string) => {
  const countryCode = country === 'Indonesia' ? 'ID' : 
                     country === 'Singapore' ? 'SG' :
                     country === 'Thailand' ? 'TH' :
                     country === 'Malaysia' ? 'MY' :
                     country === 'Vietnam' ? 'VN' :
                     country === 'Philippines' ? 'PH' : 'XX'
  const licenseNum = Math.floor(100000 + Math.random() * 900000)
  return `EXP-${countryCode}-${licenseNum}`
}

// Generate random email
const generateEmail = (name: string) => {
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '')
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  return `test+${cleanName}${randomNum}@example.com`
}

// Generate random phone number with country code
const generatePhone = (country: string) => {
  const countryPhones = {
    'Indonesia': () => `+62 ${Math.floor(800 + Math.random() * 99)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
    'Singapore': () => `+65 ${Math.floor(8000 + Math.random() * 1999)} ${Math.floor(1000 + Math.random() * 9000)}`,
    'Thailand': () => `+66 ${Math.floor(80 + Math.random() * 19)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
    'Malaysia': () => `+60 ${Math.floor(10 + Math.random() * 9)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
    'Vietnam': () => `+84 ${Math.floor(90 + Math.random() * 9)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
    'Philippines': () => `+63 ${Math.floor(900 + Math.random() * 99)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
    'United States': () => `+1 ${Math.floor(200 + Math.random() * 799)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
    'United Kingdom': () => `+44 ${Math.floor(7000 + Math.random() * 2999)} ${Math.floor(100000 + Math.random() * 900000)}`
  }
  
  const generator = countryPhones[country as keyof typeof countryPhones] || countryPhones['Indonesia']
  return generator()
}

// Generate random person name
const generatePersonName = () => {
  const firstNames = ['John', 'Sarah', 'Michael', 'Lisa', 'David', 'Emma', 'Robert', 'Maria', 'James', 'Anna']
  const lastNames = ['Anderson', 'Mitchell', 'Chen', 'Thompson', 'Williams', 'Davis', 'Johnson', 'Garcia', 'Brown', 'Lee']
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
}

/**
 * Generate random exporter onboarding data
 */
export const generateExporterOnboardingData = () => {
  const company = sampleCompanies[Math.floor(Math.random() * sampleCompanies.length)]
  const address = sampleAddresses.find(a => a.country === company.country) || sampleAddresses[0]
  
  return {
    companyName: company.name,
    country: company.country,
    taxId: generateTaxId(),
    businessType: company.businessType,
    email: generateEmail(company.name),
    phone: generatePhone(company.country),
    picName: generatePersonName(),
    address: address.address,
    exportLicense: generateExportLicense(company.country)
  }
}

/**
 * Generate random investor onboarding data
 */
export const generateInvestorOnboardingData = () => {
  const investor = sampleInvestors[Math.floor(Math.random() * sampleInvestors.length)]
  const address = sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)]
  const expectedAmounts = ['5k-25k', '25k-100k', '100k-500k', '500k+']
  const riskLevels = ['conservative', 'moderate', 'aggressive']
  
  return {
    name: investor.name,
    address: address.address,
    country: address.country,
    email: generateEmail(investor.name),
    phone: generatePhone(address.country),
    investmentProfile: investor.type,
    expectedAmount: expectedAmounts[Math.floor(Math.random() * expectedAmounts.length)],
    riskTolerance: riskLevels[Math.floor(Math.random() * riskLevels.length)]
  }
}
