var url;
if (location.hostname == "localhost" || location.hostname.includes('192.168') || location.hostname.includes('100.')) {
	// url = 'http://43.139.251.30/ls/templateText/uc/'
	url = 'https://api.templateText.ink/ls/templateText/uc/'
}else{
	// url = 'http://43.139.251.30/ls/templateText/uc/'
	url = 'https://api.templateText.ink/ls/templateText/uc/'
}

const config = {
	url
}

export default config;
