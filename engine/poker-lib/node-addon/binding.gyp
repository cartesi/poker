{
  "targets": [
    {
      "target_name": "pokerlib",
      "sources": [
        "src/*.cpp"
      ],
      "include_dirs": [ ".." ],
      "libraries": [
        "-L<!(pwd)/../../../build/lib",
        "-lpoker"
      ]
    }
  ]
}