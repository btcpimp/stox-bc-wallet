#!/bin/bash
#
# pwd

for i in */
do
  if [[ "$i" != "node_modules/" ]]
  then
    cd "./$i"
    echo "run \"$1\" command on $i"
    $1
    cd ..
  fi
done
  