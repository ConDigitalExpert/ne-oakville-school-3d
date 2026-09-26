"""Publish from Velocity. Accept a GitHub token on stdin; never store it."""
import json, os, pathlib, shutil, subprocess, sys, tempfile, urllib.request, urllib.error
root=pathlib.Path(__file__).resolve().parents[1]
os.chdir(root)
token=sys.stdin.readline().strip()
if not token: raise SystemExit("No credential received")
owner="ConDigitalExpert"; name="ne-oakville-school-3d"
def api(method,path,payload=None):
    body=None if payload is None else json.dumps(payload).encode()
    req=urllib.request.Request("https://api.github.com"+path,data=body,method=method,headers={"Authorization":"Bearer "+token,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"school-reconstruction"})
    try:
        with urllib.request.urlopen(req) as response: return json.load(response) if response.status!=204 else {}
    except urllib.error.HTTPError as e:
        if e.code==404:return None
        raise RuntimeError(str(e)+" "+e.read().decode())
assert api("GET","/user")["login"]==owner, "Unexpected publishing account"
repo=api("GET",f"/repos/{owner}/{name}")
if repo is None:
    repo=api("POST","/user/repos",{"name":name,"description":"Interactive reconstruction of NE Oakville school from photographed presentation boards. Dimensions inferred.","private":False,"auto_init":False})
elif not (root/".git").exists():
    raise SystemExit("Target repository already exists; refusing to replace it")
assert (root/"dist/index.html").exists(),"Build missing"
shutil.copytree(root/"dist",root/"docs",dirs_exist_ok=True)
(root/"docs/.nojekyll").touch()
subprocess.run(["git","init","-b","main"],check=True,stdout=subprocess.DEVNULL)
subprocess.run(["git","config","user.name","ConDigitalExpert"],check=True)
subprocess.run(["git","config","user.email","Con.digitalexpert@gmail.com"],check=True)
subprocess.run(["git","add","."],check=True)
pending=subprocess.run(["git","diff","--cached","--quiet"])
if pending.returncode:
    subprocess.run(["git","commit","-m","Build source-traced interactive school model and verified viewer"],check=True)
remotes=subprocess.check_output(["git","remote"],text=True).split()
if "origin" not in remotes:subprocess.run(["git","remote","add","origin",repo["clone_url"]],check=True)
with tempfile.TemporaryDirectory(prefix="school-publish-") as tmp:
    ask=pathlib.Path(tmp)/"askpass"
    ask.write_text('#!/bin/sh\ncase "$1" in *Username*) printf "%s" "x-access-token";; *) printf "%s" "$GH_TOKEN";; esac\n')
    ask.chmod(0o700)
    env=dict(os.environ,GH_TOKEN=token,GIT_ASKPASS=str(ask),GIT_TERMINAL_PROMPT="0")
    subprocess.run(["git","push","-u","origin","main"],env=env,check=True)
pages=api("GET",f"/repos/{owner}/{name}/pages")
if pages is None: pages=api("POST",f"/repos/{owner}/{name}/pages",{"source":{"branch":"main","path":"/docs"}})
else: pages=api("PUT",f"/repos/{owner}/{name}/pages",{"source":{"branch":"main","path":"/docs"}})
print(json.dumps({"repository":repo["html_url"],"site":pages.get("html_url",f"https://{owner.lower()}.github.io/{name}/")}))
