{
  "targets": [
    {
      "target_name": "pokerlib",
      "sources": [ "poker-lib-addon.cpp" ],
      "libraries": [
        "-L/poker/build/lib",
        "-lpoker",
         "-lgmp",
         "-lgpg-error",
         "-lpoker-eval",
         "-lTMCG",
         "-lbrotlicommon",
         "-lbrotlidec",
         "-lbrotlienc",
         "-lgcrypt"

    ]
    }
  ]
}





