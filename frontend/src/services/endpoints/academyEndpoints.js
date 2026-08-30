// NOTE: There is currently no backend route for course/academy catalog data
// (it's not one of the FastAPI routers). This is local, static content shown
// on the public landing page. If you later add a `/academies` route on the
// backend, replace the body of getAcademyCatalog() with a real `get()` call
// from '../apiClient', the same way studentEndpoints.js etc. do it.

export const academyCatalog = {
  beauty: {
    academyName: 'Zuri Academy',
    track: 'Beauty & Makeup',
    programs: [
      { title: 'Professional Makeup', icon: '✦', price: '₹24,999', points: ['Bridal glam', 'Skin prep', 'Portfolio shooting'] },
      { title: 'Hair Styling Mastery', icon: '❋', price: '₹21,999', points: ['Styling', 'Finishing', 'Trend-based prep'] },
      { title: 'Beauty Business', icon: '✧', price: '₹19,999', points: ['Client handling', 'Branding', 'Confidence coaching'] },
    ],
  },
  tech: {
    academyName: 'Morph Academy',
    track: 'Tech & Animation',
    programs: [
      { title: '3D Animation', icon: '◈', price: '₹39,999', points: ['Character motion', 'Scene setup', 'Portfolio reels'] },
      { title: 'VFX & Compositing', icon: '▣', price: '₹42,999', points: ['Visual effects', 'Shot polish', 'Industry tools'] },
      { title: 'Game & UI Design', icon: '⬢', price: '₹34,999', points: ['Game UI', 'Creative systems', 'Production flow'] },
    ],
  },
};

export async function getAcademyCatalog(track = 'Beauty & Makeup') {
  const normalizedTrack = track === 'Tech & Animation' ? 'tech' : 'beauty';
  return {
    ok: true,
    status: 200,
    data: {
      success: true,
      track,
      academy: academyCatalog[normalizedTrack],
    },
  };
}
