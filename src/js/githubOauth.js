import Molecule from './molecules/molecule.js'
import GlobalVariables from './globalvariables'

export default class GitHubModule{

    constructor(){
        this.octokit = new Octokit();
        this.popup = document.getElementById('projects-popup');
        this.currentRepoName = null;
        this.currentUser = null;
        this.bomHeader = "###### Note: Do not edit this file directly, it is automatically generated from the CAD model \n# Bill Of Materials \n |Part|Number Needed|Price|Source| \n |----|----------|-----|-----|";

        this.intervalTimer;
        
        var button = document.getElementById("loginButton");
        button.addEventListener("mousedown", (e) => {
           this.tryLogin();
        });
    }

    tryLogin(){
        // Initialize with OAuth.io app public key
        OAuth.initialize('BYP9iFpD7aTV9SDhnalvhZ4fwD8');
        // Use popup for oauth
        OAuth.popup('github').then(github => {
            
            this.octokit.authenticate({
                type: "oauth",
                token: github.access_token
            })
            
            //Test the authentication 
            this.octokit.users.getAuthenticated({}).then(result => {
                this.currentUser = result.data.login;
                this.showProjectsToLoad();
            });
        });
    }

    showProjectsToLoad(){
        //Remove everything in the this.popup now
        while (this.popup.firstChild) {
            this.popup.removeChild(this.popup.firstChild);
        }
        
        this.popup.classList.remove('off');
        this.popup.setAttribute("style", "text-align: center");
        
        var tabButtons = document.createElement("DIV");
        tabButtons.setAttribute("class", "tab");
        tabButtons.setAttribute("style", "display: inline-block;");
        this.popup.appendChild(tabButtons);
        
        var yoursButton = document.createElement("button");
        yoursButton.setAttribute("class", "tablinks");
        yoursButton.appendChild(document.createTextNode("Your Projects"));
        yoursButton.style.fontSize = "xx-large";
        yoursButton.setAttribute("id", "yoursButton");
        yoursButton.addEventListener("click", (e) => {
            this.openTab(e, "yoursButton");
        });
        tabButtons.appendChild(yoursButton);
        
        var githubButton = document.createElement("button");
        githubButton.setAttribute("class", "tablinks");
        githubButton.appendChild(document.createTextNode("All Projects"));
        githubButton.style.fontSize = "xx-large";
        githubButton.setAttribute("id", "githubButton");
        githubButton.addEventListener("click", (e) => {
            this.openTab(e, "githubButton");
        });
        tabButtons.appendChild(githubButton);
        
        this.popup.appendChild(document.createElement("br"));
        
        var searchBar = document.createElement("input");
        searchBar.setAttribute("type", "text");
        searchBar.setAttribute("placeholder", "Search for project..");
        searchBar.setAttribute("class", "menu_search");
        searchBar.setAttribute("id", "project_search");
        searchBar.setAttribute("style", "width: 50%");
        this.popup.appendChild(searchBar);
        searchBar.addEventListener('keyup', (e) => {
           this.loadProjectsBySearch(e, searchBar.value);
        });
        
        
        this.projectsSpaceDiv = document.createElement("DIV");
        this.projectsSpaceDiv.setAttribute("class", "float-left-div{");
        this.popup.appendChild(this.projectsSpaceDiv);
        
        yoursButton.click()
    }
    
    loadProjectsBySearch(ev, searchString){

        if(ev.key == "Enter"){
            //Remove projects shown now
            while (this.projectsSpaceDiv.firstChild) {
                this.projectsSpaceDiv.removeChild(this.projectsSpaceDiv.firstChild);
            }
            
            //Add the create a new project button
            this.addProject("New Project");
            
            //Load projects
            var query;
            var owned;
            if(document.getElementsByClassName("tablinks active")[0].id == "yoursButton"){
                owned = true;
                query = searchString + ' ' + 'fork:true user:' + this.currentUser + ' topic:maslowcreate';
            }
            else{
                owned = false;
                query = searchString + ' topic:maslowcreate';
            }
            
            //Figure out how many repos this user has, search will throw an error if they have 0;
            this.octokit.repos.list({
                affiliation: 'owner',
            }).then(({data, headers, status}) => {
                if(data.length == 0){                   //If the user has no repos at all, the search will fail so we want to spawn a popup here and clone the example
                    this.cloneExampleProjectPopup();
                }
            });
            
            this.octokit.search.repos({
                q: query,
                sort: "stars",
                per_page: 100,
                page: 1,
                headers: {
                    accept: 'application/vnd.github.mercy-preview+json'
                }
            }).then(result => {
                result.data.items.forEach(repo => {
                    this.addProject(repo.name, repo.id, owned);
                });
                if(result.data.items.length == 0 && searchString == ''){ //If the empty search returned no results on loading
                    this.cloneExampleProjectPopup();
                }
            }); 
        } 
    }
    
    cloneExampleProjectPopup(){
        console.log("would clone example project popup");
        this.forkByID(177732883); //This is the ID of the example project
    }
    
    addProject(projectName, id, owned){
        //create a project element to display
        
        var project = document.createElement("DIV");
        
        var projectPicture = document.createElement("IMG");
        projectPicture.setAttribute("src", "testPicture.png");
        projectPicture.setAttribute("style", "width: 100%");
        projectPicture.setAttribute("style", "height: 100%");
        project.appendChild(projectPicture);
        
        var shortProjectName;
        if(projectName.length > 9){
            shortProjectName = document.createTextNode(projectName.substr(0,7)+"..");
        }
        else{
            shortProjectName = document.createTextNode(projectName);
        }
        project.setAttribute("class", "project");
        project.setAttribute("id", projectName);
        project.appendChild(shortProjectName); 
        this.projectsSpaceDiv.appendChild(project); 
        
        document.getElementById(projectName).addEventListener('click', event => {
            this.projectClicked(projectName, id, owned);
        })

    }

    projectClicked(projectName, projectID, owned){
        //runs when you click on one of the projects
        if(projectName == "New Project"){
            this.createNewProjectPopup();
        }
        else if(owned){
            this.loadProject(projectName);
        }
        else{
            window.open('/run?'+projectID);
        }
    }
    
    openTab(evt, tabName) {
      
      // Declare all variables
      var i, tabcontent, tablinks;

      // Get all elements with class="tabcontent" and hide them
      tabcontent = document.getElementsByClassName("tabcontent");
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }

      // Get all elements with class="tablinks" and remove the class "active"
      tablinks = document.getElementsByClassName("tablinks");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }

      // Show the current tab, and add an "active" class to the button that opened the tab
      document.getElementById(tabName).style.display = "block";
      evt.currentTarget.className += " active";
      
      //Click on the search bar so that when you start typing it shows updateCommands
      document.getElementById('menuInput').focus();
      
      
      this.loadProjectsBySearch({key: "Enter"}, document.getElementById("project_search").value);
    }
    
    createNewProjectPopup(){
        //Clear the popup and populate the fields we will need to create the new repo
        
        while (this.popup.firstChild) {
            this.popup.removeChild(this.popup.firstChild);
        }
        
        //Project name
        // <div class="form">
        var createNewProjectDiv = document.createElement("DIV");
        createNewProjectDiv.setAttribute("class", "form");
        
        //Add a title
        var header = document.createElement("H1");
        var title = document.createTextNode("Create a new project");
        header.appendChild(title);
        createNewProjectDiv.appendChild(header);
        
        //Create the form object
        var form = document.createElement("form");
        form.setAttribute("class", "login-form");
        createNewProjectDiv.appendChild(form);
        
        //Create the name field
        var name = document.createElement("input");
        name.setAttribute("id","project-name");
        name.setAttribute("type","text");
        name.setAttribute("placeholder","Project name");
        form.appendChild(name);
        
        //Add the description field
        var description = document.createElement("input");
        description.setAttribute("id", "project-description");
        description.setAttribute("type", "text");
        description.setAttribute("placeholder", "Project description");
        form.appendChild(description);
        
        //Add the button
        var createButton = document.createElement("button");
        createButton.setAttribute("type", "button");
        createButton.addEventListener('click', (e) => {
           this.createNewProject();
        });
        var buttonText = document.createTextNode("Create Project");
        createButton.appendChild(buttonText);
        form.appendChild(createButton);
        

        this.popup.appendChild(createNewProjectDiv);

    }
    
    shareOpenedProject(){
        alert("A page with a shareable url to this project will open in a new window. Share the link to that page with anyone you would like to share the project with.");
            
        this.octokit.repos.get({
            owner: this.currentUser,
            repo: this.currentRepoName
        }).then(result => {
            var ID = result.data.id;
            window.open('/run?'+ID);
        });
    }
    
    openGitHubPage(){
        //Open the github page for the current project in a new tab
        this.octokit.repos.get({
            owner: this.currentUser,
            repo: this.currentRepoName
        }).then(result => {
            var url = result.data.html_url;
            window.open(url);
        });
    }
    
    createNewProject(){
        
        if(typeof this.intervalTimer != undefined){
            clearInterval(this.intervalTimer); //Turn of auto saving
        }
        
        //Get name and description
        var name = document.getElementById('project-name').value;
        var description = document.getElementById('project-description').value;
        
        //Load a blank project
        GlobalVariables.topLevelMolecule = new Molecule({
            x: 0, 
            y: 0, 
            topLevel: true, 
            name: name,
            atomType: "Molecule",
            uniqueID: GlobalVariables.generateUniqueID()
        });
        
        GlobalVariables.currentMolecule = GlobalVariables.topLevelMolecule;
        
        //Create a new repo
        this.octokit.repos.createForAuthenticatedUser({
            name: name,
            description: description
        }).then(result => {
            //Once we have created the new repo we need to create a file within it to store the project in
            this.currentRepoName = result.data.name;
            var path = "project.maslowcreate";
            var content = window.btoa(JSON.stringify(GlobalVariables.topLevelMolecule.serialize(null), null, 4)); // create a file with the new molecule in it and base64 encode it
            this.octokit.repos.createFile({
                owner: this.currentUser,
                repo: this.currentRepoName,
                path: path,
                message: "initialize repo", 
                content: content
            }).then(result => {
                //Then create the BOM file
                content = window.btoa(this.bomHeader); // create a file with just the header in it and base64 encode it
                this.octokit.repos.createFile({
                    owner: this.currentUser,
                    repo: this.currentRepoName,
                    path: "BillOfMaterials.md",
                    message: "initialize BOM", 
                    content: content
                }).then(result => {
                    //Then create the README file
                    content = window.btoa("readme init"); // create a file with just the word "init" in it and base64 encode it
                    this.octokit.repos.createFile({
                        owner: this.currentUser,
                        repo: this.currentRepoName,
                        path: "README.md",
                        message: "initialize README", 
                        content: content
                    }).then(result => {
                        console.log("Readme created");
                        
                        var _this = this;
                        this.intervalTimer = setInterval(function() { _this.saveProject(); }, 30000); //Save the project regularly
                    });
                });
            });
            
            //Update the project topics
            this.octokit.repos.replaceTopics({
                owner: this.currentUser,
                repo: this.currentRepoName,
                names: ["maslowcreate", "maslowcreate-project"],
                headers: {
                    accept: 'application/vnd.github.mercy-preview+json'
                }
            })
        });
        
        GlobalVariables.currentMolecule.backgroundClick();
        
        //Clear and hide the popup
        while (this.popup.firstChild) {
            this.popup.removeChild(this.popup.firstChild);
        }
        this.popup.classList.add('off');
        
        
    }

    saveProject(){
        //Save the current project into the github repo
        if(this.currentRepoName != null){
            var path = "project.maslowcreate";
            var content = window.btoa(JSON.stringify(GlobalVariables.topLevelMolecule.serialize(null), null, 4)); //Convert the GlobalVariables.topLevelMolecule object to a JSON string and then convert it to base64 encoding
            
            //Get the SHA for the file
            this.octokit.repos.getContents({
                owner: this.currentUser,
                repo: this.currentRepoName,
                path: path
            }).then(thisRepo => {
                var sha = thisRepo.data.sha
                
                //Save the repo to the file
                this.octokit.repos.updateFile({
                    owner: this.currentUser,
                    repo: this.currentRepoName,
                    path: path,
                    message: "autosave", 
                    content: content,
                    sha: sha
                }).then(result => {
                    console.log("Project saved");
                    //Then update the BOM file
                    
                    path = "BillOfMaterials.md";
                    content = this.bomHeader;
                    
                    GlobalVariables.topLevelMolecule.requestBOM().forEach(item => {
                        content = content + "\n|" + item.BOMitemName + "|" + item.numberNeeded + "|" + item.costUSD + "|" + item.source + "|";
                    });
                    
                    content = window.btoa(content);
                    
                    //Get the SHA for the file
                    this.octokit.repos.getContents({
                        owner: this.currentUser,
                        repo: this.currentRepoName,
                        path: path
                    }).then(result => {
                        var sha = result.data.sha
                        
                        //Save the BOM to the file
                        this.octokit.repos.updateFile({
                            owner: this.currentUser,
                            repo: this.currentRepoName,
                            path: path,
                            message: "update Bom", 
                            content: content,
                            sha: sha
                        }).then(result => {
                            console.log("BOM updated");
                            
                            this.octokit.repos.get({
                                owner: this.currentUser, 
                                repo: this.currentRepoName
                            }).then(result => {
                                
                                path = "README.md";
                                content = "# " + result.data.name + "\n" + result.data.description + "\n";
                                
                                GlobalVariables.topLevelMolecule.requestReadme().forEach(item => {
                                    content = content + item + "\n\n\n"
                                });
                                
                                content = window.btoa(content);
                                
                                //Get the SHA for the file
                                this.octokit.repos.getContents({
                                    owner: this.currentUser,
                                    repo: this.currentRepoName,
                                    path: path
                                }).then(result => {
                                    var sha = result.data.sha
                                    
                                    //Save the README to the file
                                    this.octokit.repos.updateFile({
                                        owner: this.currentUser,
                                        repo: this.currentRepoName,
                                        path: path,
                                        message: "update Readme", 
                                        content: content,
                                        sha: sha
                                    }).then(result => {
                                        console.log("README updated");
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
    }

    loadProject(projectName){
        
        if(typeof this.intervalTimer != undefined){
            clearInterval(this.intervalTimer); //Turn off auto saving
        }
        
        this.currentRepoName = projectName;
        
        this.octokit.repos.getContents({
            owner: this.currentUser,
            repo: projectName,
            path: 'project.maslowcreate'
        }).then(result => {
                
            //content will be base64 encoded
            let rawFile = atob(result.data.content);
            
            
            var moleculesList = JSON.parse(rawFile).molecules;
            
            //Load a blank project
            GlobalVariables.topLevelMolecule = new Molecule({
                x: 0, 
                y: 0, 
                topLevel: true, 
                atomType: "Molecule"
            });
            
            GlobalVariables.currentMolecule = GlobalVariables.topLevelMolecule;
            
            //Load the top level molecule from the file
            GlobalVariables.topLevelMolecule.deserialize(moleculesList, moleculesList.filter((molecule) => { return molecule.topLevel == true; })[0].uniqueID);
            
            GlobalVariables.currentMolecule.backgroundClick();

            //Clear and hide the popup
            while (this.popup.firstChild) {
                this.popup.removeChild(this.popup.firstChild);
            }
            this.popup.classList.add('off');
            
            var _this = this;
            this.intervalTimer = setInterval(function() { _this.saveProject(); }, 30000); //Save the project regularly
        })
        
    }

    exportCurrentMoleculeToGithub(molecule){
        
        //Get name and description
        var name = molecule.name;
        var description = "A stand alone molecule exported from Maslow Create";
        
        //Create a new repo
        this.octokit.repos.createForAuthenticatedUser({
            name: name,
            description: description
        }).then(result => {
            //Once we have created the new repo we need to create a file within it to store the project in
            var repoName = result.data.name;
            var id       = result.data.id;
            var path     = "project.maslowcreate";
            var content  = window.btoa("init"); // create a file with just the word "init" in it and base64 encode it
            this.octokit.repos.createFile({
                owner: this.currentUser,
                repo: repoName,
                path: path,
                message: "initialize repo", 
                content: content
            }).then(result => {
                
                //Save the molecule into the newly created repo
                
                var path = "project.maslowcreate";
                
                molecule.topLevel = true; //force the molecule to export in the long form as if it were the top level molecule
                var content = window.btoa(JSON.stringify(molecule.serialize(null), null, 4)); //Convert the passed molecule object to a JSON string and then convert it to base64 encoding
                
                //Get the SHA for the file
                this.octokit.repos.getContents({
                    owner: this.currentUser,
                    repo: repoName,
                    path: path
                }).then(result => {
                    var sha = result.data.sha
                    
                    //Save the repo to the file
                    this.octokit.repos.updateFile({
                        owner: this.currentUser,
                        repo: repoName,
                        path: path,
                        message: "export Molecule", 
                        content: content,
                        sha: sha
                    }).then(result => {
                        console.log("Molecule Exported.");
                        
                        //Replace the existing molecule now that we just exported
                        molecule.replaceThisMoleculeWithGithub(id);
                    })
                })

            });
            
            //Update the project topics
            this.octokit.repos.replaceTopics({
                owner: this.currentUser,
                repo: repoName,
                names: ["maslowcreate", "maslowcreate-molecule"],
                headers: {
                    accept: 'application/vnd.github.mercy-preview+json'
                }
            })
            
        });
    }

    forkByID(id){
        
        //Authenticate - Initialize with OAuth.io app public key
        OAuth.initialize('BYP9iFpD7aTV9SDhnalvhZ4fwD8');
        // Use popup for oauth
        OAuth.popup('github').then(github => {
            
            this.octokit.authenticate({
                type: "oauth",
                token: github.access_token,
                headers: {
                    accept: 'application/vnd.github.mercy-preview+json'
                }
            })
            
            this.octokit.request('GET /repositories/:id', {id}).then(result => {
                //Find out the information of who owns the project we are trying to fork
                var user     = result.data.owner.login;
                var repoName = result.data.name;
                
                this.octokit.repos.listTopics({
                    owner: user, 
                    repo: repoName,
                    headers: {
                        accept: 'application/vnd.github.mercy-preview+json'
                    }
                }).then(result => {
                    var topics = result.data.names;
                    
                    //Create a fork of the project with the found user name and repo name under your account
                    this.octokit.repos.createFork({
                        owner: user, 
                        repo: repoName,
                        headers: {
                            accept: 'application/vnd.github.mercy-preview+json'
                        }
                    }).then(result => {
                        var repoName = result.data.name;
                        //Manually copy over the topics which are lost in forking
                        this.octokit.repos.replaceTopics({
                            owner: result.data.owner.login,
                            repo: result.data.name,
                            names: topics,
                            headers: {
                                accept: 'application/vnd.github.mercy-preview+json'
                            }
                        }).then(result => {
                            
                            
                            //Remove everything in the this.popup now
                            while (this.popup.firstChild) {
                                this.popup.removeChild(this.popup.firstChild);
                            }
                            
                            this.popup.classList.remove('off');
                            this.popup.setAttribute("style", "text-align: center");

                            var subButtonDiv = document.createElement('div');
                            subButtonDiv.setAttribute("class", "form");
                            
                             //Add a title
                            var titleDiv = document.createElement("DIV");
                            var title = document.createElement("H3");
                            title.appendChild(document.createTextNode("A copy of the project '" + repoName + "' has been copied and added to your projects. You can view it by clicking the button below."));
                            subButtonDiv.appendChild(title);
                            subButtonDiv.appendChild(document.createElement("br"));
                            
                            var form = document.createElement("form");
                            subButtonDiv.appendChild(form);
                            var button = document.createElement("button");
                            button.setAttribute("type", "button");
                            button.appendChild(document.createTextNode("View Projects"));
                            button.addEventListener("click", (e) => {
                                window.location.href = '/';
                            });
                            form.appendChild(button);
                            this.popup.appendChild(subButtonDiv);
                        });
                    });
                });
            });
        });
    }
}
