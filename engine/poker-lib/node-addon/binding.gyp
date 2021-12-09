{
  "targets": [
    {
      "target_name": "pokerlib",
      "sources": [
        "src/*.cpp"
      ],
      "libraries": [
        "-L<!(pwd)/../../../build/lib",
        "-lpoker"
      ]
    }
  ]
}