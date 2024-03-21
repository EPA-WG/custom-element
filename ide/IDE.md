# Ide setup for DCE
<details>
<summary> VS Code </summary>
Copy into `.vscode/settings.json`

    {
      "html.customData": [
        "./node_modules/@epa-wg/custom-element/ide/customData-dce.json",
        "./node_modules/@epa-wg/custom-element/ide/customData-xsl.json",
        "./customData.json"
      ],
    }
After editing the DCE in the HTML sources, update `./customData.json` with project' custom tags and attributes.
</details>

<details>
<summary> IntelliJ </summary>
Append into `package.json`

    {
        "web-types":[   "./node_modules/@epa-wg/custom-element/ide/web-types-dce.json",
                        "./node_modules/@epa-wg/custom-element/ide/web-types-xsl.json",
                        "./web_types.json"
                    ],
    }
After editing the DCE in the HTML, update `./web-types.json` with project' custom tags and attributes.
</details>

# Publishing your components
When preparing your package for publishing, make sure the instructions on IDE support with your package and DCE package 
tags covered in IntelliJ and VS Code format.
