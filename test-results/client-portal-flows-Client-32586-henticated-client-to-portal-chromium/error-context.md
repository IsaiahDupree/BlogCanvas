# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "BlogCanvas" [level=1] [ref=e6]
        - paragraph [ref=e7]: Client Portal
      - generic [ref=e8]:
        - heading "Welcome back" [level=2] [ref=e9]
        - paragraph [ref=e10]: Sign in to review your content
        - generic [ref=e11]:
          - generic [ref=e12]:
            - generic [ref=e13]: Email
            - generic [ref=e14]:
              - img [ref=e15]
              - textbox "you@company.com" [ref=e18]
          - generic [ref=e19]:
            - generic [ref=e20]: Password
            - generic [ref=e21]:
              - img [ref=e22]
              - textbox "••••••••" [ref=e25]
          - generic [ref=e26]:
            - generic [ref=e27]:
              - checkbox "Remember me" [ref=e28]
              - generic [ref=e29]: Remember me
            - link "Forgot password?" [ref=e30] [cursor=pointer]:
              - /url: /portal/forgot-password
          - button "Sign In" [ref=e31]:
            - text: Sign In
            - img [ref=e32]
        - generic [ref=e34]:
          - generic [ref=e39]: Or continue with
          - button "Send Magic Link" [ref=e40]
      - paragraph [ref=e41]: Need help? Contact your account manager
  - button "Open Next.js Dev Tools" [ref=e47] [cursor=pointer]:
    - img [ref=e48]
  - alert [ref=e51]
```