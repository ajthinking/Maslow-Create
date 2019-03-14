
export default class GitHubModule{

    constructor(){
        this.octokit = new Octokit();
        this.popup = document.getElementById('projects-popup');
        this.currentRepoName = null;
        this.currentUser = null;
        this.bomHeader = "###### Note: Do not edit this file directly, it is automatically generated from the CAD model \n# Bill Of Materials \n |Part|Number Needed|Price|Source| \n |----|----------|-----|-----|";

        this.intervalTimer = null;
        
        var button = document.getElementById("loginButton");
        button.addEventListener("mousedown", (e) => {
           this.tryLogin();
        });
    }

    tryLogin(){
        // Initialize with your OAuth.io app public key
        OAuth.initialize('BYP9iFpD7aTV9SDhnalvhZ4fwD8');
        // Use popup for oauth
        OAuth.popup('github').then(github => {
            
            this.octokit.authenticate({
                type: "oauth",
                token: github.access_token
            })
            
            //Test the authentication 
            this.octokit.users.getAuthenticated({}).then(result => {
                this.showProjectsToLoad();
            })  
        });
    }

    showProjectsToLoad(){
        //Remove everything in the this.popup now
        while (this.popup.firstChild) {
            this.popup.removeChild(this.popup.firstChild);
        }
        
        this.popup.classList.remove('off');
        
        //Add a title
        var titleDiv = document.createElement("DIV");
        titleDiv.setAttribute("style", "width: 100%");
        titleDiv.setAttribute("style", "padding: 30px");
        var title = document.createElement("H1");
        title.appendChild(document.createTextNode("Projects:"));
        titleDiv.appendChild(title);
        this.popup.appendChild(titleDiv);
        this.popup.appendChild(document.createElement("br"));
        
        var projectsSpaceDiv = document.createElement("DIV");
        projectsSpaceDiv.setAttribute("class", "float-left-div{");
        this.popup.appendChild(projectsSpaceDiv);
        
        
        //Add the create a new project button
        addProject("New Project");
        
        //store the current user name for later use
        this.octokit.users.getAuthenticated({}).then(result => {
            this.currentUser = result.data.login;
        });
        
        //List all of the repos that a user is the owner of
        this.octokit.repos.list({
          affiliation: 'owner',
        }).then(({data, headers, status}) => {
            data.forEach(repo => {
                
                //Check to see if this is a maslow create project
                this.octokit.repos.listTopics({
                    owner: repo.owner.login, 
                    repo: repo.name,
                    headers: {
                        accept: 'application/vnd.github.mercy-preview+json'
                    }
                }).then(data => {
                    if(data.data.names.includes("maslowcreate") || data.data.names.includes("maslowcreate-molecule")){
                        addProject(repo.name);
                    }
                })
                
            });
        })
        
    }

    addProject(projectName){
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
        this.popup.appendChild(project); 
        
        document.getElementById(projectName).addEventListener('click', event => {
            this.projectClicked(projectName);
        })

    }

    projectClicked(projectName){
        //runs when you click on one of the projects
        if(projectName == "New Project"){
            this.createNewProjectPopup();
        }
        else{
            this.loadProject(projectName);
        }
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
        createButton.setAttribute("onclick", "this.createNewProject()");
        var buttonText = document.createTextNode("Create Project");
        createButton.appendChild(buttonText);
        form.appendChild(createButton);
        

        this.popup.appendChild(createNewProjectDiv);

    }

    createNewProject(){
        
        if(typeof this.intervalTimer != undefined){
            clearInterval(this.intervalTimer); //Turn of auto saving
        }
        
        //Get name and description
        var name = document.getElementById('project-name').value;
        var description = document.getElementById('project-description').value;
        
        //Load a blank project
        topLevelMolecule = new Molecule({
            x: 0, 
            y: 0, 
            topLevel: true, 
            name: name,
            atomType: "Molecule",
            uniqueID: generateUniqueID()
        });
        
        currentMolecule = topLevelMolecule;
        
        //Create a new repo
        this.octokit.repos.createForAuthenticatedUser({
            name: name,
            description: description
        }).then(result => {
            //Once we have created the new repo we need to create a file within it to store the project in
            this.currentRepoName = result.data.name;
            var path = "project.maslowcreate";
            var content = window.btoa("init"); // create a file with just the word "init" in it and base64 encode it
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
                        console.log("readme created");
                        
                        this.intervalTimer = setInterval(this.saveProject, 30000); //Save the project regularly
                    });
                });
            });
            
            //Update the project topics
            this.octokit.repos.replaceTopics({
                owner: this.currentUser,
                repo: this.currentRepoName,
                names: ["maslowcreate"],
                headers: {
                    accept: 'application/vnd.github.mercy-preview+json'
                }
            })
        });
        
        currentMolecule.backgroundClick();
        
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
            var content = window.btoa(JSON.stringify(topLevelMolecule.serialize(null), null, 4)); //Convert the topLevelMolecule object to a JSON string and then convert it to base64 encoding
            
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
                    
                    console.log("Project Saved");
                    
                    //Then update the BOM file
                    
                    path = "BillOfMaterials.md";
                    content = this.bomHeader;
                    
                    topLevelMolecule.requestBOM().forEach(item => {
                        content = content + "\n|" + item.BOMitemName + "|" + item.totalNeeded + "|" + item.costUSD + "|" + item.source + "|";
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
                                
                                topLevelMolecule.requestReadme().forEach(item => {
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
            clearInterval(this.intervalTimer); //Turn of auto saving
        }
        
        this.currentRepoName = projectName;
        
        this.octokit.repos.getContents({
            owner: this.currentUser,
            repo: projectName,
            path: 'project.maslowcreate'
        }).then(result => {
                
            //content will be base64 encoded
            let rawFile = atob(result.data.content);
            
            
            moleculesList = JSON.parse(rawFile).molecules;
            
            //Load a blank project
            topLevelMolecule = new Molecule({
                x: 0, 
                y: 0, 
                topLevel: true, 
                atomType: "Molecule"
            });
            
            currentMolecule = topLevelMolecule;
            
            //Load the top level molecule from the file
            topLevelMolecule.deserialize(moleculesList, moleculesList.filter((molecule) => { return molecule.topLevel == true; })[0].uniqueID);
            
            currentMolecule.backgroundClick();

            //Clear and hide the popup
            while (this.popup.firstChild) {
                this.popup.removeChild(this.popup.firstChild);
            }
            this.popup.classList.add('off');
            
            this.intervalTimer = setInterval(this.saveProject, 30000); //Save the project regularly
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
                names: ["maslowcreate-molecule"],
                headers: {
                    accept: 'application/vnd.github.mercy-preview+json'
                }
            })
            
        });
    }

}
