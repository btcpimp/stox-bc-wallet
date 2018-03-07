#!/bin/bash
#
# pwd

echo installing packages
npm install rimraf -g

cd "./common"
echo "installing common/"
if [ "$1" != "clean" ]
then
    rimraf node_modules/
    rimraf package-lock.json
fi
npm install
cd ..

for i in */
do
    if [[ "$i" != "common/" && "$i" != "node_modules/" ]]
    then
        cd "./$i"
        echo "installing $i"
        if [ "$1" != "clean" ]
        then
            rimraf node_modules/
            rimraf package-lock.json
        fi
        npm install
        cd ..
    fi
done