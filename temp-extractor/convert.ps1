$word = New-Object -ComObject Word.Application
$word.Visible = $false
$currentDir = Resolve-Path ".."
$docFiles = Get-ChildItem -Path $currentDir -Filter "*.doc"
foreach ($docFile in $docFiles) {
    $docPath = $docFile.FullName
    $docxPath = $docPath + "x"
    if (!(Test-Path $docxPath)) {
        Write-Host "Converting $($docFile.Name) to $($docFile.Name)x"
        $doc = $word.Documents.Open($docPath)
        $doc.SaveAs2($docxPath, 16) # 16 is wdFormatXMLDocument (.docx)
        $doc.Close()
        Write-Host "Converted successfully!"
    } else {
        Write-Host "Already exists: $($docFile.Name)x"
    }
}
$word.Quit()
