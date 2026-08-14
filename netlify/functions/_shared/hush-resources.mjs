// The HUSH shelf. Approved by JoYi 2026-08-14 from the CONCIERGE_SCOPE HUSH tier list,
// plus Moxie Studios (her addition, space held until the member door is confirmed) and
// the Office on Women's Health (government resources for women are encouraged).
// Exclusion rule: any platform whose free tier exists to sell a subscription is not shelved.
// Every URL verified live 2026-08-14. Review the shelf by 2026-11-14.

export const HUSH_SHELF_META = {
  approvedBy: "JoYi",
  approvedAt: "2026-08-14",
  reviewBy: "2026-11-14",
};

export const HUSH_SHELF = [
  {
    id: "moxie-studios",
    title: "Moxie Studios · beginner mindful meditation",
    org: "A Practice Village room",
    url: null,
    status: "connecting",
    statusLabel: "Being connected",
    good: "Meditation with a teacher. Beginner mindful meditation taught in the Studio, with Bott Om beside you and live classes as they open.",
    limits: "Your member door is being connected. We will not hand you a marketing page instead.",
    meanwhile: {
      label: "Try the free studio demo meanwhile",
      url: "https://moxiestudio.netlify.app/zenbottom-schedule.html?demo=1",
    },
    cost: "Included with membership",
    languages: null,
  },
  {
    id: "ucla-marc",
    title: "UCLA MARC guided meditations",
    org: "UCLA Health, Mindful Awareness Research Center",
    url: "https://www.uclahealth.org/programs/marc/free-guided-meditations",
    good: "A guided voice without an app or an account. Recordings from three to nineteen minutes, ready when you are.",
    limits: "Recordings, not a course. No progression and no personalization.",
    cost: "Free, no account",
    languages: "English and Spanish, with more languages on the site",
  },
  {
    id: "palouse-mbsr",
    title: "Palouse Mindfulness: the full MBSR course",
    org: "Palouse Mindfulness, taught by a certified MBSR instructor",
    url: "https://palousemindfulness.com/",
    good: "The complete eight-week Mindfulness-Based Stress Reduction course, self-paced, with the readings and practices others charge hundreds for.",
    limits: "Self-guided. No live teacher or group unless you arrange your own.",
    cost: "Free",
    languages: "English, with translated materials for many practices",
  },
  {
    id: "healthy-minds",
    title: "Healthy Minds Program",
    org: "Healthy Minds Innovations, a nonprofit from Dr. Richard Davidson's research team",
    url: "https://hminnovations.org/meditation-app",
    good: "A structured training path on your phone: awareness, connection, insight, purpose. Built on published research.",
    limits: "An app with an account. Phone-first, not a website you can browse.",
    cost: "Free, nonprofit",
    languages: "English",
  },
  {
    id: "nih-nccih",
    title: "Meditation and mindfulness: what the evidence says",
    org: "NIH, National Center for Complementary and Integrative Health",
    url: "https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety",
    good: "The receipts. What research actually supports, what it does not, and safety considerations in plain language.",
    limits: "Information, not practice. Nothing here guides a session.",
    cost: "Free",
    languages: "English and Spanish",
  },
  {
    id: "va-mindfulness-coach",
    title: "VA Mindfulness Coach",
    org: "U.S. Department of Veterans Affairs",
    url: "https://mobile.va.gov/app/mindfulness-coach",
    good: "A free government-built app with guided exercises, a training plan, and progress you can see. Open to everyone, not only veterans.",
    limits: "Written for veterans first, so some framing speaks to military life.",
    cost: "Free, no account",
    languages: "English",
  },
  {
    id: "owh-stress",
    title: "Stress and your health",
    org: "HHS Office on Women's Health, womenshealth.gov",
    url: "https://www.womenshealth.gov/mental-health/good-mental-health/stress-and-your-health",
    good: "What stress does to a woman's body and what helps, from the government office built to answer exactly that.",
    limits: "Information, not practice. Talk with a clinician about anything medical.",
    cost: "Free",
    languages: "English and Spanish",
  },
];
