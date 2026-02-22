'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'

interface FormData {
  fullName: string
  email: string
  phoneNumber: string
  age: string
  gender: string
  password: string
  confirmPassword: string
  allergies: string
  existingDiseases: string
  clearedDiseases: string
  currentMedicines: string
  agreeToTerms: boolean
}

interface FormErrors {
  [key: string]: string
}

export default function SignupPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    age: '',
    gender: '',
    password: '',
    confirmPassword: '',
    allergies: '',
    existingDiseases: '',
    clearedDiseases: '',
    currentMedicines: '',
    agreeToTerms: false,
  })

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number'
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Age is required'
    } else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 120) {
      newErrors.age = 'Age must be between 18 and 120'
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select a gender'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.existingDiseases.trim()) {
      newErrors.existingDiseases = 'Please specify existing diseases or "None"'
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
      if (errors[name]) {
        setErrors((prev) => {
          const updated = { ...prev }
          delete updated[name]
          return updated
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      addToast('error', 'Validation Error', 'Please fill in all required fields correctly')
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Store signup data in sessionStorage for OTP page
      sessionStorage.setItem('signupData', JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      }))

      addToast('success', 'Registration Successful', 'Redirecting to OTP verification')
      setTimeout(() => {
        router.push('/verify-otp')
      }, 500)
    } catch (error) {
      addToast('error', 'Registration Failed', 'Please try again later')
      setIsLoading(false)
    }
  }

  const passwordStrength = formData.password.length >= 8 ? 'strong' : 'weak'

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Create Your Account
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Complete your medical profile to get started with HealthChat
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                  />
                  {errors.fullName && (
                    <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={16} />
                      {errors.fullName}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                  />
                  {errors.email && (
                    <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={16} />
                      {errors.email}
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="9876543210"
                    disabled={isLoading}
                    maxLength={15}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                  />
                  {errors.phoneNumber && (
                    <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={16} />
                      {errors.phoneNumber}
                    </div>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Age <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="30"
                    min="18"
                    max="120"
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                  />
                  {errors.age && (
                    <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={16} />
                      {errors.age}
                    </div>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Gender <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 appearance-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  {errors.gender && (
                    <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={16} />
                      {errors.gender}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Security Information */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Security Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Password <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 pr-10 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`h-1.5 flex-1 rounded-full ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className={`text-xs font-medium ${passwordStrength === 'strong' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {passwordStrength === 'strong' ? 'Strong' : 'Weak'}
                      </span>
                    </div>
                  )}
                  {errors.password && (
                    <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={16} />
                      {errors.password}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Confirm Password <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 pr-10 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400">Passwords match</span>
                        </>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">Passwords do not match</span>
                      )}
                    </div>
                  )}
                  {errors.confirmPassword && (
                    <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={16} />
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Medical Information
              </h2>

              <div className="space-y-4">
                {/* Allergies */}
                <div>
                  <label htmlFor="allergies" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Allergies (Optional)
                  </label>
                  <textarea
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="List any allergies (e.g., Penicillin, Nuts) or write 'None'"
                    disabled={isLoading}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Existing Diseases */}
                <div>
                  <label htmlFor="existingDiseases" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Existing Diseases/Conditions <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="existingDiseases"
                    name="existingDiseases"
                    value={formData.existingDiseases}
                    onChange={handleChange}
                    placeholder="List any current medical conditions (e.g., Diabetes, Asthma) or write 'None'"
                    disabled={isLoading}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 resize-none"
                  />
                  {errors.existingDiseases && (
                    <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={16} />
                      {errors.existingDiseases}
                    </div>
                  )}
                </div>

                {/* Cleared Diseases */}
                <div>
                  <label htmlFor="clearedDiseases" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Cleared/Recovered Diseases (Optional)
                  </label>
                  <textarea
                    id="clearedDiseases"
                    name="clearedDiseases"
                    value={formData.clearedDiseases}
                    onChange={handleChange}
                    placeholder="List any diseases you have recovered from (e.g., COVID-19, Fracture) or write 'None'"
                    disabled={isLoading}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Current Medicines */}
                <div>
                  <label htmlFor="currentMedicines" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Current Medicines (Optional)
                  </label>
                  <textarea
                    id="currentMedicines"
                    name="currentMedicines"
                    value={formData.currentMedicines}
                    onChange={handleChange}
                    placeholder="List current medications (e.g., Aspirin 500mg, Metformin) or write 'None'"
                    disabled={isLoading}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                disabled={isLoading}
                className="w-4 h-4 rounded border-blue-200 dark:border-blue-800 text-blue-600 focus:ring-2 focus:ring-blue-600 mt-1"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                I agree to the{' '}
                <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Privacy Policy
                </Link>
                {' '}
                <span className="text-red-600">*</span>
              </span>
            </label>
            {errors.agreeToTerms && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} />
                {errors.agreeToTerms}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" text="Creating Account..." />
              ) : (
                'Create Account & Verify OTP'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-blue-200 dark:border-blue-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login Link */}
            <Link
              href="/login"
              className="block w-full py-2.5 border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
            >
              Sign In Instead
            </Link>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
