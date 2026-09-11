// Product-site artwork, keyed by ID so CMS reordering cannot mismatch images.
export const PRODUCT_PREVIEWS: Record<string, { src: string; width: number; height: number; alt: { zh: string; en: string } }> = {
  chargepilot: {
    src: "/previews/chargepilot-dashboard.jpg",
    width: 960,
    height: 720,
    alt: {
      zh: "ChargePilot 实际界面：充电上限、电池健康、温度与实时能量监测",
      en: "ChargePilot interface in Chinese, showing charge limits, battery health, temperature, and live energy monitoring",
    },
  },
};
