/**
 * Beautiful ASCII banner and startup information for the Gaana API.
 */
export const showBanner = (port?: number) => {
  const orange = '\x1b[38;5;208m'
  const blue = '\x1b[38;5;33m'
  const green = '\x1b[38;5;78m'
  const purple = '\x1b[38;5;135m'
  const cyan = '\x1b[38;5;87m'
  const gray = '\x1b[38;5;245m'
  const white = '\x1b[38;5;255m'
  const reset = '\x1b[0m'
  const bold = '\x1b[1m'

  const banner = `
${orange}${bold}  ____                              _    ____ ___ 
 / ___| __ _  __ _ _ __   __ _     / \\  |  _ \\_ _|
| |  _ / _\` |/ _\` | '_ \\ / _\` |   / _ \\ | |_) | | 
| |_| | (_| | (_| | | | | (_| |  / ___ \\|  __/| | 
 \\____|\\__,_|\\__,_|_| |_|\\__,_| /_/   \\_\\_|  |___|${reset}

${bold}${white}🎵 Unofficial Gaana API - v1.0.0${reset}
${gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}
👤 ${bold}${cyan}Author:${reset}    ${white}notdeltaxd${reset}
🔗 ${bold}${blue}Repo:${reset}      ${gray}https://github.com/notdeltaxd/Gaana-API${reset}
📜 ${bold}${purple}License:${reset}   ${green}Apache-2.0${reset}
${port ? `🌐 ${bold}${orange}URL:${reset}       ${white}http://localhost:${port}/api${reset}` : ''}
${gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}
`
  console.log(banner)
}
