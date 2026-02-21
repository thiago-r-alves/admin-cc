$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root
New-Item -Path public\fonts -ItemType Directory -Force | Out-Null

# Fetch Google Fonts CSS to obtain canonical WOFF2 URLs, then download them
$cssUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
$headers = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
$css = Invoke-WebRequest -Uri $cssUrl -UseBasicParsing -Headers $headers -ErrorAction Stop
$content = $css.Content
# Debug: write CSS to tmp file for inspection
$content | Out-File -FilePath tmp_css_debug.txt -Encoding utf8
$matches = [regex]::Matches($content,'https://fonts.gstatic.com/[^)\s]+\.woff2')
$i = 0
foreach ($m in $matches) {
	$url = $m.Value
	$name = switch ($i) {0{'Inter-Regular.woff2'}1{'Inter-Medium.woff2'}2{'Inter-SemiBold.woff2'}3{'Inter-Bold.woff2'} Default{"Inter-$i.woff2"} }
	Write-Output "Downloading $url -> public/fonts/$name"
	Invoke-WebRequest -Uri $url -OutFile (Join-Path 'public\fonts' $name) -UseBasicParsing -ErrorAction Stop
	$i++
}

Write-Output 'Fonts copied to public/fonts:'
Get-ChildItem -Path public\fonts | ForEach-Object { Write-Output $_.Name }
