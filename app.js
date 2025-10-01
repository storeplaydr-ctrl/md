// ExNebula Learning Platform - Frontend JavaScript
class ExNebulaApp {
  constructor() {
    this.currentUser = null;
    this.authToken = localStorage.getItem('authToken');
    this.socket = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    if (this.authToken) {
      this.validateToken();
    }
    this.initSocket();
  }

  setupEventListeners() {
    // Auth buttons
    document.getElementById('loginBtn')?.addEventListener('click', () => this.showAuth('login'));
    document.getElementById('signupBtn')?.addEventListener('click', () => this.showAuth('signup'));
    document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

    // Close modal
    document.querySelector('.close')?.addEventListener('click', () => this.hideAuth());

    // Auth forms
    document.getElementById('authForm')?.addEventListener('submit', (e) => this.handleAuth(e));

    // Learning path form
    document.getElementById('learningPathForm')?.addEventListener('submit', (e) => this.generateLearningPath(e));

    // AI Mentor chat
    document.getElementById('mentorForm')?.addEventListener('submit', (e) => this.sendMentorMessage(e));

    // Community chat
    document.getElementById('communityForm')?.addEventListener('submit', (e) => this.sendCommunityMessage(e));

    // Click outside modal to close
    document.getElementById('authModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'authModal') {
        this.hideAuth();
      }
    });
  }

  async validateToken() {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.setCurrentUser(data.user);
      } else {
        this.logout();
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      this.logout();
    }
  }

  showAuth(mode) {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('authTitle');
    const submitBtn = document.getElementById('authSubmit');
    const nameGroup = document.getElementById('nameGroup');

    modal.classList.remove('hidden');

    if (mode === 'login') {
      title.textContent = 'Login';
      submitBtn.textContent = 'Login';
      nameGroup.style.display = 'none';
    } else {
      title.textContent = 'Sign Up';
      submitBtn.textContent = 'Sign Up';
      nameGroup.style.display = 'block';
    }

    modal.dataset.mode = mode;
  }

  hideAuth() {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('authForm').reset();
    this.clearAlert();
  }

  async handleAuth(e) {
    e.preventDefault();
    this.clearAlert();

    const mode = document.getElementById('authModal').dataset.mode;
    const formData = new FormData(e.target);

    const payload = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    if (mode === 'signup') {
      payload.name = formData.get('name');
    }

    const submitBtn = document.getElementById('authSubmit');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading"></span> Processing...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        this.authToken = data.token;
        localStorage.setItem('authToken', data.token);
        this.setCurrentUser(data.user);
        this.hideAuth();
        this.showAlert('success', `Welcome${mode === 'login' ? ' back' : ''}, ${data.user.name}!`);
      } else {
        this.showAlert('error', data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      this.showAlert('error', 'Network error. Please try again.');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  logout() {
    this.authToken = null;
    this.currentUser = null;
    localStorage.removeItem('authToken');
    this.updateUI();
    this.showAlert('success', 'Logged out successfully');

    if (this.socket) {
      this.socket.disconnect();
    }
  }

  setCurrentUser(user) {
    this.currentUser = user;
    this.updateUI();
    this.loadUserLearningPaths();
  }

  updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');

    if (this.currentUser) {
      loginBtn.style.display = 'none';
      signupBtn.style.display = 'none';
      logoutBtn.style.display = 'block';
      if (userInfo) {
        userInfo.textContent = `Welcome, ${this.currentUser.name}`;
        userInfo.style.display = 'block';
      }
    } else {
      loginBtn.style.display = 'block';
      signupBtn.style.display = 'block';
      logoutBtn.style.display = 'none';
      if (userInfo) {
        userInfo.style.display = 'none';
      }
    }
  }

  async generateLearningPath(e) {
    e.preventDefault();

    if (!this.currentUser) {
      this.showAlert('error', 'Please login to generate learning paths');
      return;
    }

    this.clearAlert();
    const formData = new FormData(e.target);

    const payload = {
      topic: formData.get('topic'),
      difficulty: formData.get('difficulty'),
      duration: formData.get('duration')
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading"></span> Generating...';
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/learning-path/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        this.displayLearningPath(data.learningPath);
        this.showAlert('success', 'Learning path generated successfully!');
        e.target.reset();
      } else {
        this.showAlert('error', data.error || 'Failed to generate learning path');
      }
    } catch (error) {
      console.error('Learning path generation error:', error);
      this.showAlert('error', 'Network error. Please try again.');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  displayLearningPath(learningPath) {
    const container = document.getElementById('learningPathResult');
    if (!container) return;

    container.innerHTML = `
      <h3>${learningPath.title}</h3>
      <p>${learningPath.description}</p>
      <div class="modules">
        ${learningPath.modules.map((module, index) => 
          `<div class="module">${index + 1}. ${module}</div>`
        ).join('')}
      </div>
    `;
    container.classList.add('active');
  }

  async loadUserLearningPaths() {
    if (!this.currentUser) return;

    try {
      const response = await fetch('/api/learning-path/my-paths', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // You can display user's existing learning paths here if needed
        console.log('User learning paths:', data.learningPaths);
      }
    } catch (error) {
      console.error('Failed to load learning paths:', error);
    }
  }

  async sendMentorMessage(e) {
    e.preventDefault();

    if (!this.currentUser) {
      this.showAlert('error', 'Please login to chat with AI mentor');
      return;
    }

    const input = e.target.querySelector('input[name="message"]');
    const message = input.value.trim();

    if (!message) return;

    this.addMessageToChat('mentorMessages', message, 'user');
    input.value = '';

    try {
      const response = await fetch('/api/chat/mentor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      if (response.ok) {
        this.addMessageToChat('mentorMessages', data.response, 'ai');
      } else {
        this.addMessageToChat('mentorMessages', 'Sorry, I encountered an error. Please try again.', 'ai');
      }
    } catch (error) {
      console.error('Mentor chat error:', error);
      this.addMessageToChat('mentorMessages', 'Network error. Please check your connection.', 'ai');
    }
  }

  initSocket() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('Connected to server');
      if (this.currentUser) {
        this.socket.emit('join-community');
      }
    });

    this.socket.on('community-message', (data) => {
      this.addMessageToChat('communityMessages', data.message, 'community', data.user);
    });

    this.socket.on('user-joined', (message) => {
      this.addMessageToChat('communityMessages', message, 'system');
    });
  }

  sendCommunityMessage(e) {
    e.preventDefault();

    if (!this.currentUser) {
      this.showAlert('error', 'Please login to participate in community chat');
      return;
    }

    const input = e.target.querySelector('input[name="message"]');
    const message = input.value.trim();

    if (!message) return;

    this.socket.emit('community-message', {
      message,
      user: this.currentUser.name
    });

    input.value = '';
  }

  addMessageToChat(containerId, message, type, user = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', type);

    if (type === 'community' && user) {
      messageDiv.innerHTML = `<strong>${user}:</strong> ${message}`;
    } else if (type === 'system') {
      messageDiv.innerHTML = `<em>${message}</em>`;
      messageDiv.style.opacity = '0.7';
    } else {
      messageDiv.textContent = message;
    }

    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
  }

  showAlert(type, message) {
    this.clearAlert();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);

    setTimeout(() => {
      alert.remove();
    }, 5000);
  }

  clearAlert() {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
      existingAlert.remove();
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ExNebulaApp();
});
