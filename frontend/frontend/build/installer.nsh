!macro preInit
    ${If} ${RunningX64}
        StrCpy $INSTDIR "$PROGRAMFILES64\${PRODUCT_NAME}"
    ${Else}
        StrCpy $INSTDIR "$PROGRAMFILES32\${PRODUCT_NAME}"
    ${EndIf}
!macroend
