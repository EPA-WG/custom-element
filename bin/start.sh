
if [ x"${GIT_PROXY}" == "x" ]; then
      echo "PC"
      npm i --no-save @web/dev-server
  else
      echo "SANDBOX"
      npm i @web/dev-server
  fi

web-dev-server --node-resolve
