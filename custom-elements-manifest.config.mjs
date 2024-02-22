import { customElementVsCodePlugin } from "custom-element-vs-code-integration";
import { customElementJetBrainsPlugin } from "custom-element-jet-brains-integration";

export default {
    /** Globs to analyze */
    globs: ['components.js'],
    /** Provide custom plugins */
    plugins: [
        customElementVsCodePlugin({ cssFileName: null }),
        customElementJetBrainsPlugin({ packageJson: true })
    ],
  }