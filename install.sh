#!/bin/bash
#
# pwd

echo installing packages
npm install rimraf -g

for i in */
do
    if [[ "$i" != "node_modules/" ]]
    then
        cd "./$i"
        if [ "$1" == "clean" ]
        then
            echo "cleaning $i"
            rimraf node_modules/
            rimraf package-lock.json
        fi
        echo "installing $i"
        npm install
        cd ..
    fi
done