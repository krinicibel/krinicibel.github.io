
            // Startup 
            // Hook up the the loaded event for the document/window, to linkify the document content
            var startupFunction = function() { linkifyElement("messages"); };
            
            if(window.attachEvent)
            {
              window.attachEvent('onload', startupFunction);
            }
            else if (window.addEventListener) 
            {
              window.addEventListener('load', startupFunction, false);
            }
            else 
            {
              document.addEventListener('load', startupFunction, false);
            } 
            
            // Toggles the visibility of table rows with the specified name 
            function toggleTableRowsByName(name)
            {
               var allRows = document.getElementsByTagName('tr');
               for (i=0; i < allRows.length; i++)
               {
                  var currentName = allRows[i].getAttribute('name');
                  if(!!currentName && currentName.indexOf(name) == 0)
                  {
                      var isVisible = allRows[i].style.display == ''; 
                      isVisible ? allRows[i].style.display = 'none' : allRows[i].style.display = '';
                  }
               }
            }
            
            function scrollToFirstVisibleRow(name) 
            {
               var allRows = document.getElementsByTagName('tr');
               for (i=0; i < allRows.length; i++)
               {
                  var currentName = allRows[i].getAttribute('name');
                  var isVisible = allRows[i].style.display == ''; 
                  if(!!currentName && currentName.indexOf(name) == 0 && isVisible)
                  {
                     allRows[i].scrollIntoView(true); 
                     return true; 
                  }
               }
               
               return false;
            }
            
            // Linkifies the specified text content, replaces candidate links with html links 
            function linkify(text)
            {
                 if(!text || 0 === text.length)
                 {
                     return text; 
                 }

                 // Find http, https and ftp links and replace them with hyper links 
                 var urlLink = /(http|https|ftp)\:\/\/[a-zA-Z0-9\-\.]+(:[a-zA-Z0-9]*)?\/?([a-zA-Z0-9\-\._\?\,\/\\\+&%\$#\=~;\{\}])*/gi;
                 
                 return text.replace(urlLink, '<a href="$&">$&</a>') ;
            }
            
            // Linkifies the specified element by ID
            function linkifyElement(id)
            {
                var element = document.getElementById(id);
                if(!!element)
                {
                  element.innerHTML = linkify(element.innerHTML); 
                }
            }
            
            function ToggleMessageVisibility(projectName)
            {
              if(!projectName || 0 === projectName.length)
              {
                return; 
              }
              
              toggleTableRowsByName("MessageRowClass" + projectName);
              toggleTableRowsByName('MessageRowHeaderShow' + projectName);
              toggleTableRowsByName('MessageRowHeaderHide' + projectName); 
            }
            
            function ScrollToFirstVisibleMessage(projectName)
            {
              if(!projectName || 0 === projectName.length)
              {
                return; 
              }
              
              // First try the 'Show messages' row
              if(!scrollToFirstVisibleRow('MessageRowHeaderShow' + projectName))
              {
                // Failed to find a visible row for 'Show messages', try an actual message row 
                scrollToFirstVisibleRow('MessageRowClass' + projectName); 
              }
            }