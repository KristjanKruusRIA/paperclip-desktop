!macro customUnInstall
  ${ifNot} ${isUpdated}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.paperclipai.app"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "com.paperclipai.app"
  ${endIf}
!macroend

!macro customInstall
  ; Remove the obsolete loose runtime, including interrupted older installs.
  RMDir /r "$INSTDIR\resources\app-server\server"
  RMDir /r "$INSTDIR\resources\app-server\node-bin"
!macroend
