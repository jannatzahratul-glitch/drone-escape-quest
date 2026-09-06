/**
 * Single source of truth for the privacy policy shown both inside the game
 * (privacy screen) and on the public /privacy web page used for the store
 * listing URL. Keep the two in sync by importing from here.
 */
export const PRIVACY_UPDATED = "September 2026";
export const PRIVACY_CONTACT = "support@mazeescape.app";

export interface PolicySection {
  title: string;
  body: string[];
}

export const PRIVACY_INTRO =
  "Maze Escape is a single-player offline puzzle game. We do not collect, store, or share any personal information.";

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    title: "Information we collect",
    body: [
      "None. The game has no account system, no sign-in, and no analytics or advertising services.",
      "We never collect your name, email address, phone number, contacts, photos, location, or device identifiers.",
    ],
  },
  {
    title: "Data stored on your device",
    body: [
      "Your progress — unlocked levels, stars, best times, scores, coins, XP, daily reward status and settings — is saved locally on your device only.",
      "This data never leaves your device and is not sent to us or to anyone else. Uninstalling the app deletes it permanently.",
    ],
  },
  {
    title: "Permissions",
    body: [
      "The game requests no sensitive permissions. It does not need the internet to play, and it does not access your camera, microphone, files, or location.",
    ],
  },
  {
    title: "Third parties",
    body: [
      "There are no advertisements, no in-app purchases, no third-party trackers, and no third-party SDKs that collect data.",
    ],
  },
  {
    title: "Children's privacy",
    body: [
      "Because no data is collected from anyone, the game is safe for players of all ages, including children under 13.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "If this policy ever changes, the updated version will be published in the app and on this page with a new date.",
    ],
  },
  {
    title: "Contact",
    body: [`Questions about this policy? Write to ${PRIVACY_CONTACT}.`],
  },
];
